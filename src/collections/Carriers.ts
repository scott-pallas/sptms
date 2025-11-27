import type { CollectionConfig } from 'payload'

export const Carriers: CollectionConfig = {
  slug: 'carriers',
  admin: {
    useAsTitle: 'companyName',
    defaultColumns: ['companyName', 'mcNumber', 'dotNumber', 'status'],
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
      label: 'Carrier Company Name',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'Pending Approval', value: 'pending' },
        { label: 'Do Not Use', value: 'do-not-use' },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Authority & Compliance',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'mcNumber',
                  type: 'text',
                  label: 'MC Number',
                  required: true,
                  admin: {
                    width: '50%',
                  },
                },
                {
                  name: 'dotNumber',
                  type: 'text',
                  label: 'DOT Number',
                  required: true,
                  admin: {
                    width: '50%',
                  },
                },
              ],
            },
            {
              name: 'safetyRating',
              type: 'select',
              label: 'FMCSA Safety Rating',
              options: [
                { label: 'Satisfactory', value: 'satisfactory' },
                { label: 'Conditional', value: 'conditional' },
                { label: 'Unsatisfactory', value: 'unsatisfactory' },
                { label: 'Not Rated', value: 'not-rated' },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'insuranceExpiration',
                  type: 'date',
                  label: 'Insurance Expiration',
                  admin: {
                    width: '50%',
                    date: {
                      pickerAppearance: 'dayOnly',
                    },
                  },
                },
                {
                  name: 'w9OnFile',
                  type: 'checkbox',
                  label: 'W-9 on File',
                  defaultValue: false,
                  admin: {
                    width: '50%',
                  },
                },
              ],
            },
            {
              name: 'carrierPacketComplete',
              type: 'checkbox',
              label: 'Carrier Packet Complete',
              defaultValue: false,
            },
            {
              name: 'approvedDate',
              type: 'date',
              label: 'Approval Date',
              admin: {
                date: {
                  pickerAppearance: 'dayOnly',
                },
              },
            },
          ],
        },
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
              name: 'dispatchEmail',
              type: 'email',
              label: 'Dispatch Email',
              admin: {
                description: 'Email for sending rate confirmations',
              },
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
                  label: 'Role',
                },
              ],
            },
          ],
        },
        {
          label: 'Equipment & Lanes',
          fields: [
            {
              name: 'equipmentTypes',
              type: 'select',
              label: 'Equipment Types',
              hasMany: true,
              options: [
                { label: 'Dry Van', value: 'dry-van' },
                { label: 'Reefer', value: 'reefer' },
                { label: 'Flatbed', value: 'flatbed' },
                { label: 'Step Deck', value: 'step-deck' },
                { label: 'Power Only', value: 'power-only' },
                { label: 'Hotshot', value: 'hotshot' },
                { label: 'Box Truck', value: 'box-truck' },
              ],
            },
            {
              name: 'preferredLanes',
              type: 'textarea',
              label: 'Preferred Lanes',
              admin: {
                description: 'e.g., "CA to TX", "Midwest regional"',
              },
            },
            {
              name: 'serviceAreas',
              type: 'textarea',
              label: 'Service Areas',
            },
          ],
        },
        {
          label: 'Payment & Performance',
          fields: [
            {
              name: 'paymentMethod',
              type: 'select',
              label: 'Payment Method',
              options: [
                { label: 'Standard (Net 30)', value: 'standard' },
                { label: 'Quick Pay', value: 'quick-pay' },
                { label: 'Factoring Company', value: 'factoring' },
              ],
              defaultValue: 'standard',
            },
            {
              name: 'factoringCompany',
              type: 'text',
              label: 'Factoring Company Name',
              admin: {
                condition: (data) => data?.paymentMethod === 'factoring',
              },
            },
            {
              name: 'ePayCarrierId',
              type: 'text',
              label: 'ePay Carrier ID',
              admin: {
                readOnly: true,
                description: 'Synced from ePay',
              },
            },
            {
              name: 'performanceScore',
              type: 'number',
              label: 'Performance Score',
              min: 0,
              max: 100,
              admin: {
                description: 'Auto-calculated based on on-time %, claims, etc.',
                readOnly: true,
              },
            },
            {
              name: 'onTimePercentage',
              type: 'number',
              label: 'On-Time Percentage',
              min: 0,
              max: 100,
              admin: {
                readOnly: true,
              },
            },
          ],
        },
        {
          label: 'Notes & Documents',
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
            },
          ],
        },
      ],
    },
  ],
  timestamps: true,
}
