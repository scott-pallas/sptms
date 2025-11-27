import type { CollectionConfig } from 'payload'

export const Customers: CollectionConfig = {
  slug: 'customers',
  admin: {
    useAsTitle: 'companyName',
    defaultColumns: ['companyName', 'primaryContact', 'email', 'status'],
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
  },
  fields: [
    {
      name: 'companyName',
      type: 'text',
      required: true,
      label: 'Company Name',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'On Hold', value: 'on-hold' },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Contact Information',
          fields: [
            {
              name: 'primaryContact',
              type: 'text',
              label: 'Primary Contact Name',
            },
            {
              name: 'email',
              type: 'email',
              label: 'Email',
            },
            {
              name: 'phone',
              type: 'text',
              label: 'Phone',
            },
            {
              name: 'alternatePhone',
              type: 'text',
              label: 'Alternate Phone',
            },
            {
              name: 'additionalContacts',
              type: 'array',
              label: 'Additional Contacts',
              fields: [
                {
                  name: 'name',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'email',
                  type: 'email',
                },
                {
                  name: 'phone',
                  type: 'text',
                },
                {
                  name: 'role',
                  type: 'text',
                  label: 'Role/Title',
                },
              ],
            },
          ],
        },
        {
          label: 'Billing & Terms',
          fields: [
            {
              name: 'billingEmail',
              type: 'email',
              label: 'Billing Email',
            },
            {
              name: 'paymentTerms',
              type: 'select',
              label: 'Payment Terms',
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
              name: 'creditLimit',
              type: 'number',
              label: 'Credit Limit ($)',
              admin: {
                description: 'Maximum outstanding balance allowed',
              },
            },
            {
              name: 'quickbooksCustomerId',
              type: 'text',
              label: 'QuickBooks Customer ID',
              admin: {
                readOnly: true,
                description: 'Synced from QuickBooks',
              },
            },
          ],
        },
        {
          label: 'Notes & Settings',
          fields: [
            {
              name: 'notes',
              type: 'textarea',
              label: 'Internal Notes',
            },
            {
              name: 'specialInstructions',
              type: 'textarea',
              label: 'Special Instructions',
              admin: {
                description: 'Default instructions for loads from this customer',
              },
            },
            {
              name: 'requiresPOD',
              type: 'checkbox',
              label: 'Requires POD for Invoice',
              defaultValue: true,
            },
          ],
        },
      ],
    },
  ],
  timestamps: true,
}
