import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'filename',
  },
  access: {
    read: () => true,
  },
  upload: {
    mimeTypes: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    staticDir: 'media',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Alt Text',
    },
    {
      name: 'documentType',
      type: 'select',
      label: 'Document Type',
      options: [
        { label: 'BOL (Bill of Lading)', value: 'bol' },
        { label: 'POD (Proof of Delivery)', value: 'pod' },
        { label: 'Rate Confirmation', value: 'rate-con' },
        { label: 'Invoice', value: 'invoice' },
        { label: 'Lumper Receipt', value: 'lumper' },
        { label: 'Detention Receipt', value: 'detention' },
        { label: 'Insurance Certificate', value: 'insurance' },
        { label: 'W-9', value: 'w9' },
        { label: 'Carrier Packet', value: 'carrier-packet' },
        { label: 'Other', value: 'other' },
      ],
    },
  ],
}
