import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'

// Generate pay sheet number (format: PAY-YYYYMM-XXXX)
const generatePaySheetNumber = async (payload: any): Promise<string> => {
  const now = new Date()
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const prefix = `PAY-${yearMonth}-`

  const existingPayments = await payload.find({
    collection: 'carrier-payments',
    where: {
      paySheetNumber: {
        like: prefix,
      },
    },
    sort: '-paySheetNumber',
    limit: 1,
  })

  let nextNumber = 1
  if (existingPayments.docs.length > 0) {
    const lastNumber = existingPayments.docs[0].paySheetNumber
    const lastSequence = parseInt(lastNumber.split('-').pop() || '0', 10)
    nextNumber = lastSequence + 1
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`
}

// Calculate totals
const beforeChangeHook: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  const payload = req.payload

  // Auto-generate pay sheet number on create
  if (operation === 'create' && !data.paySheetNumber) {
    data.paySheetNumber = await generatePaySheetNumber(payload)
  }

  // Calculate line item totals
  let subtotal = 0
  if (data.lineItems && Array.isArray(data.lineItems)) {
    data.lineItems = data.lineItems.map((item: any) => {
      const lineTotal = item.amount || 0
      subtotal += lineTotal
      return item
    })
  }

  // Add deductions
  let totalDeductions = 0
  if (data.deductions && Array.isArray(data.deductions)) {
    totalDeductions = data.deductions.reduce((sum: number, d: any) => sum + (d.amount || 0), 0)
  }

  data.subtotal = subtotal
  data.totalDeductions = totalDeductions
  data.total = subtotal - totalDeductions

  // Calculate due date based on payment type
  if (data.createdAt || operation === 'create') {
    const baseDate = new Date(data.createdAt || new Date())
    let daysToAdd = 30 // Standard

    if (data.paymentType === 'quick-pay') {
      daysToAdd = 2 // Quick pay is typically 1-3 days
    }

    const dueDate = new Date(baseDate)
    dueDate.setDate(dueDate.getDate() + daysToAdd)
    data.dueDate = dueDate.toISOString()
  }

  return data
}

export const CarrierPayments: CollectionConfig = {
  slug: 'carrier-payments',
  admin: {
    useAsTitle: 'paySheetNumber',
    defaultColumns: ['paySheetNumber', 'carrier', 'total', 'status', 'dueDate'],
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
      name: 'paySheetNumber',
      type: 'text',
      unique: true,
      label: 'Pay Sheet Number',
      admin: {
        description: 'Auto-generated if left blank (format: PAY-YYYYMM-XXXX)',
        placeholder: 'Leave blank to auto-generate',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Submitted to ePay', value: 'submitted' },
        { label: 'Processing', value: 'processing' },
        { label: 'Paid', value: 'paid' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Void', value: 'void' },
      ],
    },
    {
      name: 'carrier',
      type: 'relationship',
      relationTo: 'carriers',
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
      name: 'paymentType',
      type: 'select',
      required: true,
      defaultValue: 'standard',
      options: [
        { label: 'Standard (Net 30)', value: 'standard' },
        { label: 'Quick Pay', value: 'quick-pay' },
        { label: 'Factoring', value: 'factoring' },
      ],
    },
    {
      name: 'quickPayFee',
      type: 'number',
      label: 'Quick Pay Fee (%)',
      defaultValue: 3,
      admin: {
        condition: (data) => data?.paymentType === 'quick-pay',
        description: 'Percentage fee for quick pay',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'dueDate',
          type: 'date',
          label: 'Due Date',
          admin: {
            width: '50%',
            date: { pickerAppearance: 'dayOnly' },
          },
        },
        {
          name: 'paidDate',
          type: 'date',
          label: 'Paid Date',
          admin: {
            width: '50%',
            date: { pickerAppearance: 'dayOnly' },
          },
        },
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
              name: 'load',
              type: 'relationship',
              relationTo: 'loads',
              label: 'Load',
              admin: { width: '50%' },
            },
            {
              name: 'amount',
              type: 'number',
              required: true,
              label: 'Amount ($)',
              admin: { width: '50%' },
            },
          ],
        },
        {
          name: 'type',
          type: 'select',
          defaultValue: 'linehaul',
          options: [
            { label: 'Line Haul', value: 'linehaul' },
            { label: 'Detention', value: 'detention' },
            { label: 'Layover', value: 'layover' },
            { label: 'Lumper', value: 'lumper' },
            { label: 'Fuel Advance', value: 'fuel-advance' },
            { label: 'Other', value: 'other' },
          ],
        },
      ],
    },
    {
      name: 'deductions',
      type: 'array',
      label: 'Deductions',
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
              name: 'amount',
              type: 'number',
              required: true,
              label: 'Amount ($)',
              admin: { width: '50%' },
            },
            {
              name: 'type',
              type: 'select',
              defaultValue: 'other',
              options: [
                { label: 'Quick Pay Fee', value: 'quick-pay-fee' },
                { label: 'Insurance Deduction', value: 'insurance' },
                { label: 'Cargo Claim', value: 'cargo-claim' },
                { label: 'Chargeback', value: 'chargeback' },
                { label: 'Other', value: 'other' },
              ],
              admin: { width: '50%' },
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
            width: '33%',
            readOnly: true,
          },
        },
        {
          name: 'totalDeductions',
          type: 'number',
          label: 'Total Deductions ($)',
          admin: {
            width: '33%',
            readOnly: true,
          },
        },
        {
          name: 'total',
          type: 'number',
          label: 'Total ($)',
          admin: {
            width: '34%',
            readOnly: true,
          },
        },
      ],
    },
    {
      name: 'paymentDetails',
      type: 'group',
      label: 'Payment Details',
      fields: [
        {
          name: 'paymentMethod',
          type: 'select',
          options: [
            { label: 'ACH', value: 'ach' },
            { label: 'Check', value: 'check' },
            { label: 'Wire', value: 'wire' },
            { label: 'Comchek', value: 'comchek' },
            { label: 'EFS', value: 'efs' },
          ],
        },
        {
          name: 'checkNumber',
          type: 'text',
          label: 'Check/Reference Number',
        },
        {
          name: 'bankAccount',
          type: 'text',
          label: 'Bank Account (Last 4)',
        },
      ],
    },
    {
      name: 'factoringCompany',
      type: 'group',
      label: 'Factoring Company',
      admin: {
        condition: (data) => data?.paymentType === 'factoring',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'Company Name',
        },
        {
          name: 'remitTo',
          type: 'textarea',
          label: 'Remit To Address',
        },
      ],
    },
    {
      name: 'epay',
      type: 'group',
      label: 'ePay Integration',
      admin: {
        description: 'ePay sync information',
      },
      fields: [
        {
          name: 'paymentId',
          type: 'text',
          label: 'ePay Payment ID',
          admin: { readOnly: true },
        },
        {
          name: 'submittedAt',
          type: 'date',
          label: 'Submitted to ePay',
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
            { label: 'Submitted', value: 'submitted' },
            { label: 'Processing', value: 'processing' },
            { label: 'Completed', value: 'completed' },
            { label: 'Error', value: 'error' },
          ],
          defaultValue: 'not-synced',
        },
        {
          name: 'syncError',
          type: 'text',
          admin: {
            condition: (data) => data?.epay?.syncStatus === 'error',
          },
        },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Notes',
    },
    {
      name: 'approvedBy',
      type: 'relationship',
      relationTo: 'users',
      label: 'Approved By',
    },
    {
      name: 'approvedAt',
      type: 'date',
      label: 'Approved Date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
  ],
  timestamps: true,
}
