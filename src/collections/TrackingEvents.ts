import type { CollectionConfig } from 'payload'

export const TrackingEvents: CollectionConfig = {
  slug: 'tracking-events',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['load', 'eventType', 'location', 'timestamp'],
    group: 'Tracking',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
  },
  fields: [
    {
      name: 'load',
      type: 'relationship',
      relationTo: 'loads',
      required: true,
      index: true,
    },
    {
      name: 'eventType',
      type: 'select',
      required: true,
      options: [
        { label: 'Location Update', value: 'location' },
        { label: 'Arrived at Pickup', value: 'arrived-pickup' },
        { label: 'Departed Pickup', value: 'departed-pickup' },
        { label: 'Arrived at Delivery', value: 'arrived-delivery' },
        { label: 'Departed Delivery', value: 'departed-delivery' },
        { label: 'In Transit', value: 'in-transit' },
        { label: 'Delay', value: 'delay' },
        { label: 'Exception', value: 'exception' },
      ],
    },
    {
      name: 'timestamp',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      index: true,
    },
    {
      name: 'location',
      type: 'group',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'latitude',
              type: 'number',
              admin: { width: '50%' },
            },
            {
              name: 'longitude',
              type: 'number',
              admin: { width: '50%' },
            },
          ],
        },
        {
          name: 'city',
          type: 'text',
        },
        {
          name: 'state',
          type: 'text',
        },
        {
          name: 'address',
          type: 'text',
        },
      ],
    },
    {
      name: 'source',
      type: 'select',
      required: true,
      defaultValue: 'macropoint',
      options: [
        { label: 'MacroPoint', value: 'macropoint' },
        { label: 'Manual', value: 'manual' },
        { label: 'ELD', value: 'eld' },
        { label: 'GPS', value: 'gps' },
        { label: 'Mobile App', value: 'mobile' },
      ],
    },
    {
      name: 'macropointData',
      type: 'group',
      label: 'MacroPoint Data',
      admin: {
        condition: (data) => data?.source === 'macropoint',
      },
      fields: [
        {
          name: 'orderId',
          type: 'text',
          label: 'MacroPoint Order ID',
        },
        {
          name: 'eventCode',
          type: 'text',
          label: 'Event Code',
          admin: {
            description: 'X1=pickup, X3=arrived pickup, X2=delivery, X4=arrived delivery',
          },
        },
        {
          name: 'rawPayload',
          type: 'json',
          label: 'Raw Webhook Payload',
        },
      ],
    },
    {
      name: 'eta',
      type: 'group',
      label: 'ETA Information',
      fields: [
        {
          name: 'estimatedArrival',
          type: 'date',
          label: 'Estimated Arrival',
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
        },
        {
          name: 'milesRemaining',
          type: 'number',
          label: 'Miles Remaining',
        },
        {
          name: 'minutesRemaining',
          type: 'number',
          label: 'Minutes Remaining',
        },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
  timestamps: true,
}
