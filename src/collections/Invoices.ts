import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'

// Generate invoice number (format: INV-YYYYMM-XXXX)
const generateInvoiceNumber = async (payload: any): Promise<string> => {
  const now = new Date()
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const prefix = `INV-${yearMonth}-`

  const existingInvoices = await payload.find({
    collection: 'invoices',
    where: {
      invoiceNumber: {
        like: prefix,
      },
    },
    sort: '-invoiceNumber',
    limit: 1,
  })

  let nextNumber = 1
  if (existingInvoices.docs.length > 0) {
    const lastNumber = existingInvoices.docs[0].invoiceNumber
    const lastSequence = parseInt(lastNumber.split('-').pop() || '0', 10)
    nextNumber = lastSequence + 1
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`
}

// Calculate totals and due date
const beforeChangeHook: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  const payload = req.payload

  // Auto-generate invoice number on create
  if (operation === 'create' && !data.invoiceNumber) {
    data.invoiceNumber = await generateInvoiceNumber(payload)
  }

  // Calculate line item totals and subtotal
  let subtotal = 0
  if (data.lineItems && Array.isArray(data.lineItems)) {
    data.lineItems = data.lineItems.map((item: any) => {
      const lineTotal = (item.quantity || 1) * (item.rate || 0)
      subtotal += lineTotal
      return { ...item, total: lineTotal }
    })
  }

  data.subtotal = subtotal
  data.total = subtotal // Can add tax logic here if needed

  // Calculate due date based on payment terms
  if (data.invoiceDate && data.paymentTerms) {
    const invoiceDate = new Date(data.invoiceDate)
    let daysToAdd = 30 // default

    switch (data.paymentTerms) {
      case 'due-on-receipt':
        daysToAdd = 0
        break
      case 'net-15':
        daysToAdd = 15
        break
      case 'net-30':
        daysToAdd = 30
        break
      case 'net-45':
        daysToAdd = 45
        break
      case 'net-60':
        daysToAdd = 60
        break
    }

    const dueDate = new Date(invoiceDate)
    dueDate.setDate(dueDate.getDate() + daysToAdd)
    data.dueDate = dueDate.toISOString()
  }

  return data
}

export const Invoices: CollectionConfig = {
  slug: 'invoices',
  admin: {
    useAsTitle: 'invoiceNumber',
    defaultColumns: ['invoiceNumber', 'customer', 'total', 'status', 'dueDate'],
    group: 'Financial',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
  },
  hooks: {
    beforeChange: [beforeChangeHook],
  },
  fields: [
    {
      name: 'invoiceNumber',
      type: 'text',
      unique: true,
      label: 'Invoice Number',
      admin: {
        description: 'Auto-generated if left blank (format: INV-YYYYMM-XXXX)',
        placeholder: 'Leave blank to auto-generate',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Sent', value: 'sent' },
        { label: 'Viewed', value: 'viewed' },
        { label: 'Partial', value: 'partial' },
        { label: 'Paid', value: 'paid' },
        { label: 'Overdue', value: 'overdue' },
        { label: 'Void', value: 'void' },
      ],
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      required: true,
      hasMany: false,
    },
    {
      name: 'loads',
      type: 'relationship',
      relationTo: 'loads',
      hasMany: true,
      label: 'Associated Loads',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'invoiceDate',
          type: 'date',
          required: true,
          defaultValue: () => new Date().toISOString(),
          admin: {
            width: '50%',
            date: {
              pickerAppearance: 'dayOnly',
            },
          },
        },
        {
          name: 'dueDate',
          type: 'date',
          admin: {
            width: '50%',
            date: {
              pickerAppearance: 'dayOnly',
            },
            description: 'Auto-calculated from payment terms',
          },
        },
      ],
    },
    {
      name: 'paymentTerms',
      type: 'select',
      defaultValue: 'net-30',
      options: [
        { label: 'Due on Receipt', value: 'due-on-receipt' },
        { label: 'Net 15', value: 'net-15' },
        { label: 'Net 30', value: 'net-30' },
        { label: 'Net 45', value: 'net-45' },
        { label: 'Net 60', value: 'net-60' },
      ],
    },
    {
      name: 'lineItems',
      type: 'array',
      label: 'Line Items',
      minRows: 1,
      fields: [
        {
          name: 'description',
          type: 'text',
          required: true,
        },
        {
          type: 'row',
          fields: [
            {
              name: 'quantity',
              type: 'number',
              defaultValue: 1,
              min: 1,
              admin: { width: '25%' },
            },
            {
              name: 'rate',
              type: 'number',
              required: true,
              label: 'Rate ($)',
              admin: { width: '25%' },
            },
            {
              name: 'total',
              type: 'number',
              label: 'Total ($)',
              admin: {
                width: '25%',
                readOnly: true,
                description: 'Auto-calculated',
              },
            },
            {
              name: 'load',
              type: 'relationship',
              relationTo: 'loads',
              label: 'Related Load',
              admin: { width: '25%' },
            },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'subtotal',
          type: 'number',
          label: 'Subtotal ($)',
          admin: {
            width: '50%',
            readOnly: true,
          },
        },
        {
          name: 'total',
          type: 'number',
          label: 'Total ($)',
          admin: {
            width: '50%',
            readOnly: true,
          },
        },
      ],
    },
    {
      name: 'payments',
      type: 'array',
      label: 'Payments Received',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'paymentDate',
              type: 'date',
              required: true,
              admin: {
                width: '33%',
                date: { pickerAppearance: 'dayOnly' },
              },
            },
            {
              name: 'amount',
              type: 'number',
              required: true,
              label: 'Amount ($)',
              admin: { width: '33%' },
            },
            {
              name: 'method',
              type: 'select',
              options: [
                { label: 'Check', value: 'check' },
                { label: 'ACH', value: 'ach' },
                { label: 'Wire', value: 'wire' },
                { label: 'Credit Card', value: 'credit-card' },
                { label: 'Other', value: 'other' },
              ],
              admin: { width: '34%' },
            },
          ],
        },
        {
          name: 'referenceNumber',
          type: 'text',
          label: 'Check/Reference Number',
        },
        {
          name: 'notes',
          type: 'text',
        },
      ],
    },
    {
      name: 'amountPaid',
      type: 'number',
      label: 'Amount Paid ($)',
      defaultValue: 0,
      admin: {
        readOnly: true,
        description: 'Auto-calculated from payments',
      },
    },
    {
      name: 'balanceDue',
      type: 'number',
      label: 'Balance Due ($)',
      admin: {
        readOnly: true,
        description: 'Auto-calculated',
      },
    },
    {
      name: 'billingAddress',
      type: 'group',
      label: 'Billing Address',
      fields: [
        { name: 'companyName', type: 'text' },
        { name: 'addressLine1', type: 'text' },
        { name: 'addressLine2', type: 'text' },
        {
          type: 'row',
          fields: [
            { name: 'city', type: 'text', admin: { width: '40%' } },
            { name: 'state', type: 'text', admin: { width: '30%' } },
            { name: 'zipCode', type: 'text', admin: { width: '30%' } },
          ],
        },
      ],
    },
    {
      name: 'quickbooks',
      type: 'group',
      label: 'QuickBooks Integration',
      admin: {
        description: 'QuickBooks sync information',
      },
      fields: [
        {
          name: 'invoiceId',
          type: 'text',
          label: 'QuickBooks Invoice ID',
          admin: { readOnly: true },
        },
        {
          name: 'syncedAt',
          type: 'date',
          label: 'Last Synced',
          admin: {
            readOnly: true,
            date: { pickerAppearance: 'dayAndTime' },
          },
        },
        {
          name: 'syncStatus',
          type: 'select',
          options: [
            { label: 'Not Synced', value: 'not-synced' },
            { label: 'Synced', value: 'synced' },
            { label: 'Error', value: 'error' },
          ],
          defaultValue: 'not-synced',
        },
        {
          name: 'syncError',
          type: 'text',
          admin: {
            condition: (data) => data?.quickbooks?.syncStatus === 'error',
          },
        },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Notes (appears on invoice)',
    },
    {
      name: 'internalNotes',
      type: 'textarea',
      label: 'Internal Notes',
    },
    {
      name: 'sentAt',
      type: 'date',
      label: 'Sent Date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'sentTo',
      type: 'text',
      label: 'Sent To Email',
    },
  ],
  timestamps: true,
}
