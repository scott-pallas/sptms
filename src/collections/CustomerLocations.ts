import type { CollectionConfig } from 'payload'

export const CustomerLocations: CollectionConfig = {
  slug: 'customer-locations',
  admin: {
    useAsTitle: 'locationName',
    defaultColumns: ['locationName', 'customer', 'city', 'state'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      required: true,
      hasMany: false,
    },
    {
      name: 'locationName',
      type: 'text',
      required: true,
      label: 'Location Name',
      admin: {
        description: 'e.g., "Main Warehouse" or "Distribution Center"',
      },
    },
    {
      name: 'locationType',
      type: 'select',
      required: true,
      options: [
        { label: 'Pickup', value: 'pickup' },
        { label: 'Delivery', value: 'delivery' },
        { label: 'Both', value: 'both' },
      ],
      defaultValue: 'both',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'addressLine1',
          type: 'text',
          required: true,
          label: 'Address Line 1',
          admin: {
            width: '50%',
          },
        },
        {
          name: 'addressLine2',
          type: 'text',
          label: 'Address Line 2',
          admin: {
            width: '50%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'city',
          type: 'text',
          required: true,
          admin: {
            width: '40%',
          },
        },
        {
          name: 'state',
          type: 'text',
          required: true,
          admin: {
            width: '30%',
            placeholder: 'CA',
          },
        },
        {
          name: 'zipCode',
          type: 'text',
          required: true,
          label: 'ZIP Code',
          admin: {
            width: '30%',
          },
        },
      ],
    },
    {
      name: 'contactName',
      type: 'text',
      label: 'On-Site Contact Name',
    },
    {
      name: 'contactPhone',
      type: 'text',
      label: 'On-Site Contact Phone',
    },
    {
      name: 'hours',
      type: 'textarea',
      label: 'Operating Hours',
      admin: {
        description: 'e.g., "Mon-Fri 8am-5pm"',
      },
    },
    {
      name: 'appointmentRequired',
      type: 'checkbox',
      label: 'Appointment Required',
      defaultValue: false,
    },
    {
      name: 'specialInstructions',
      type: 'textarea',
      label: 'Special Instructions',
      admin: {
        description: 'Gate codes, parking instructions, etc.',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Internal Notes',
    },
  ],
  timestamps: true,
}
