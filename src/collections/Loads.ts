import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'

// Generate next load number (format: SPTMS-YYYYMM-XXXX)
const generateLoadNumber = async (payload: any): Promise<string> => {
  const now = new Date()
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const prefix = `SPTMS-${yearMonth}-`

  // Find the highest load number for this month
  const existingLoads = await payload.find({
    collection: 'loads',
    where: {
      loadNumber: {
        like: prefix,
      },
    },
    sort: '-loadNumber',
    limit: 1,
  })

  let nextNumber = 1
  if (existingLoads.docs.length > 0) {
    const lastNumber = existingLoads.docs[0].loadNumber
    const lastSequence = parseInt(lastNumber.split('-').pop() || '0', 10)
    nextNumber = lastSequence + 1
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`
}

// Calculate margin from customer rate and carrier rate
const calculateMargin = (customerRate?: number, carrierRate?: number): number => {
  if (!customerRate || !carrierRate) return 0
  return customerRate - carrierRate
}

// Before change hook for load number, margin, and status history
const beforeChangeHook: CollectionBeforeChangeHook = async ({ data, originalDoc, req, operation }) => {
  const payload = req.payload

  // Auto-generate load number on create if not provided
  if (operation === 'create' && !data.loadNumber) {
    data.loadNumber = await generateLoadNumber(payload)
  }

  // Calculate margin
  data.margin = calculateMargin(data.customerRate, data.carrierRate)

  // Track status changes
  const currentStatus = data.status
  const previousStatus = originalDoc?.status

  if (operation === 'create' || (currentStatus && currentStatus !== previousStatus)) {
    const statusHistory = data.statusHistory || originalDoc?.statusHistory || []
    statusHistory.push({
      status: currentStatus,
      timestamp: new Date().toISOString(),
      note: operation === 'create' ? 'Load created' : `Status changed from ${previousStatus} to ${currentStatus}`,
    })
    data.statusHistory = statusHistory
  }

  return data
}

export const Loads: CollectionConfig = {
  slug: 'loads',
  admin: {
    useAsTitle: 'loadNumber',
    defaultColumns: ['loadNumber', 'customer', 'status', 'pickupDate', 'deliveryDate'],
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
      name: 'loadNumber',
      type: 'text',
      unique: true,
      label: 'Load Number',
      admin: {
        description: 'Auto-generated if left blank (format: SPTMS-YYYYMM-XXXX)',
        placeholder: 'Leave blank to auto-generate',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'booked',
      options: [
        { label: 'Booked', value: 'booked' },
        { label: 'Dispatched', value: 'dispatched' },
        { label: 'In Transit', value: 'in-transit' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Invoiced', value: 'invoiced' },
        { label: 'Paid', value: 'paid' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'TONU', value: 'tonu' },
      ],
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Customer & Billing',
          fields: [
            {
              name: 'customer',
              type: 'relationship',
              relationTo: 'customers',
              required: true,
              hasMany: false,
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'customerRate',
                  type: 'number',
                  required: true,
                  label: 'Customer Rate ($)',
                  admin: {
                    width: '50%',
                  },
                },
                {
                  name: 'customerCurrency',
                  type: 'select',
                  defaultValue: 'USD',
                  options: [
                    { label: 'USD', value: 'USD' },
                  ],
                  admin: {
                    width: '50%',
                  },
                },
              ],
            },
            {
              name: 'customerReferenceNumbers',
              type: 'group',
              label: 'Reference Numbers',
              fields: [
                {
                  name: 'poNumber',
                  type: 'text',
                  label: 'PO Number',
                },
                {
                  name: 'bolNumber',
                  type: 'text',
                  label: 'BOL Number',
                },
                {
                  name: 'proNumber',
                  type: 'text',
                  label: 'PRO Number',
                },
              ],
            },
          ],
        },
        {
          label: 'Pickup',
          fields: [
            {
              name: 'pickupLocation',
              type: 'relationship',
              relationTo: 'customer-locations',
              label: 'Pickup Location',
              filterOptions: ({ data }) => {
                if (data?.customer) {
                  return {
                    customer: {
                      equals: data.customer,
                    },
                  }
                }
                return true
              },
            },
            {
              name: 'pickupAddress',
              type: 'group',
              label: 'Pickup Address (if not using saved location)',
              fields: [
                {
                  name: 'facilityName',
                  type: 'text',
                },
                {
                  name: 'addressLine1',
                  type: 'text',
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
                  name: 'zipCode',
                  type: 'text',
                },
                {
                  name: 'contactName',
                  type: 'text',
                },
                {
                  name: 'contactPhone',
                  type: 'text',
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'pickupDate',
                  type: 'date',
                  required: true,
                  label: 'Pickup Date',
                  admin: {
                    width: '50%',
                    date: {
                      pickerAppearance: 'dayAndTime',
                    },
                  },
                },
                {
                  name: 'pickupDateEnd',
                  type: 'date',
                  label: 'Pickup Window End',
                  admin: {
                    width: '50%',
                    date: {
                      pickerAppearance: 'dayAndTime',
                    },
                  },
                },
              ],
            },
            {
              name: 'pickupAppointment',
              type: 'checkbox',
              label: 'Appointment Required',
            },
            {
              name: 'pickupInstructions',
              type: 'textarea',
              label: 'Pickup Instructions',
            },
          ],
        },
        {
          label: 'Delivery',
          fields: [
            {
              name: 'deliveryLocation',
              type: 'relationship',
              relationTo: 'customer-locations',
              label: 'Delivery Location',
              filterOptions: ({ data }) => {
                if (data?.customer) {
                  return {
                    customer: {
                      equals: data.customer,
                    },
                  }
                }
                return true
              },
            },
            {
              name: 'deliveryAddress',
              type: 'group',
              label: 'Delivery Address (if not using saved location)',
              fields: [
                {
                  name: 'facilityName',
                  type: 'text',
                },
                {
                  name: 'addressLine1',
                  type: 'text',
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
                  name: 'zipCode',
                  type: 'text',
                },
                {
                  name: 'contactName',
                  type: 'text',
                },
                {
                  name: 'contactPhone',
                  type: 'text',
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'deliveryDate',
                  type: 'date',
                  required: true,
                  label: 'Delivery Date',
                  admin: {
                    width: '50%',
                    date: {
                      pickerAppearance: 'dayAndTime',
                    },
                  },
                },
                {
                  name: 'deliveryDateEnd',
                  type: 'date',
                  label: 'Delivery Window End',
                  admin: {
                    width: '50%',
                    date: {
                      pickerAppearance: 'dayAndTime',
                    },
                  },
                },
              ],
            },
            {
              name: 'deliveryAppointment',
              type: 'checkbox',
              label: 'Appointment Required',
            },
            {
              name: 'deliveryInstructions',
              type: 'textarea',
              label: 'Delivery Instructions',
            },
          ],
        },
        {
          label: 'Freight Details',
          fields: [
            {
              name: 'miles',
              type: 'number',
              label: 'Miles',
              admin: {
                description: 'Total miles for this load',
              },
            },
            {
              name: 'equipmentType',
              type: 'select',
              required: true,
              label: 'Equipment Type',
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
              type: 'row',
              fields: [
                {
                  name: 'weight',
                  type: 'number',
                  label: 'Weight (lbs)',
                  admin: {
                    width: '33%',
                  },
                },
                {
                  name: 'length',
                  type: 'number',
                  label: 'Length (ft)',
                  admin: {
                    width: '33%',
                  },
                },
                {
                  name: 'palletCount',
                  type: 'number',
                  label: 'Pallet Count',
                  admin: {
                    width: '34%',
                  },
                },
              ],
            },
            {
              name: 'commodity',
              type: 'text',
              label: 'Commodity Description',
            },
            {
              name: 'specialRequirements',
              type: 'select',
              label: 'Special Requirements',
              hasMany: true,
              options: [
                { label: 'Team Driver', value: 'team' },
                { label: 'Hazmat', value: 'hazmat' },
                { label: 'Temperature Controlled', value: 'temp-controlled' },
                { label: 'Liftgate', value: 'liftgate' },
                { label: 'Inside Delivery', value: 'inside-delivery' },
                { label: 'Tarps', value: 'tarps' },
              ],
            },
            {
              name: 'temperature',
              type: 'text',
              label: 'Temperature',
              admin: {
                description: 'e.g., "38-42°F"',
                condition: (data) => data?.specialRequirements?.includes('temp-controlled'),
              },
            },
          ],
        },
        {
          label: 'Carrier & Dispatch',
          fields: [
            {
              name: 'carrier',
              type: 'relationship',
              relationTo: 'carriers',
              label: 'Assigned Carrier',
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'carrierRate',
                  type: 'number',
                  label: 'Carrier Rate ($)',
                  admin: {
                    width: '50%',
                  },
                },
                {
                  name: 'margin',
                  type: 'number',
                  label: 'Margin ($)',
                  admin: {
                    width: '50%',
                    readOnly: true,
                    description: 'Auto-calculated',
                  },
                },
              ],
            },
            {
              name: 'driverInfo',
              type: 'group',
              label: 'Driver Information',
              fields: [
                {
                  name: 'driverName',
                  type: 'text',
                  label: 'Driver Name',
                },
                {
                  name: 'driverPhone',
                  type: 'text',
                  label: 'Driver Phone',
                },
                {
                  name: 'truckNumber',
                  type: 'text',
                  label: 'Truck Number',
                },
                {
                  name: 'trailerNumber',
                  type: 'text',
                  label: 'Trailer Number',
                },
              ],
            },
            {
              name: 'rateConSent',
              type: 'checkbox',
              label: 'Rate Confirmation Sent',
              defaultValue: false,
            },
            {
              name: 'rateConSentDate',
              type: 'date',
              label: 'Rate Con Sent Date',
              admin: {
                date: {
                  pickerAppearance: 'dayAndTime',
                },
              },
            },
          ],
        },
        {
          label: 'Accessorials & Fees',
          fields: [
            {
              name: 'accessorials',
              type: 'array',
              label: 'Accessorials',
              fields: [
                {
                  name: 'type',
                  type: 'select',
                  required: true,
                  options: [
                    { label: 'Detention', value: 'detention' },
                    { label: 'Layover', value: 'layover' },
                    { label: 'TONU (Truck Ordered Not Used)', value: 'tonu' },
                    { label: 'Lumper Fee', value: 'lumper' },
                    { label: 'Stop Charge', value: 'stop' },
                    { label: 'Fuel Surcharge', value: 'fuel' },
                    { label: 'Other', value: 'other' },
                  ],
                },
                {
                  name: 'description',
                  type: 'text',
                },
                {
                  name: 'amount',
                  type: 'number',
                  required: true,
                },
                {
                  name: 'billTo',
                  type: 'select',
                  required: true,
                  options: [
                    { label: 'Customer', value: 'customer' },
                    { label: 'Carrier', value: 'carrier' },
                    { label: 'Internal', value: 'internal' },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Documents',
          fields: [
            {
              name: 'documents',
              type: 'relationship',
              relationTo: 'media',
              hasMany: true,
              label: 'Attached Documents',
            },
            {
              name: 'requiredDocuments',
              type: 'group',
              label: 'Document Status',
              fields: [
                {
                  name: 'hasBOL',
                  type: 'checkbox',
                  label: 'BOL Received',
                  defaultValue: false,
                },
                {
                  name: 'hasPOD',
                  type: 'checkbox',
                  label: 'POD Received',
                  defaultValue: false,
                },
                {
                  name: 'hasRateCon',
                  type: 'checkbox',
                  label: 'Rate Con on File',
                  defaultValue: false,
                },
              ],
            },
          ],
        },
        {
          label: 'Tracking & Status',
          fields: [
            {
              name: 'macropointTracking',
              type: 'group',
              label: 'MacroPoint Tracking',
              fields: [
                {
                  name: 'trackingId',
                  type: 'text',
                  label: 'Tracking ID',
                  admin: {
                    readOnly: true,
                  },
                },
                {
                  name: 'trackingActive',
                  type: 'checkbox',
                  label: 'Tracking Active',
                  defaultValue: false,
                },
                {
                  name: 'lastLocation',
                  type: 'text',
                  label: 'Last Known Location',
                  admin: {
                    readOnly: true,
                  },
                },
                {
                  name: 'lastUpdate',
                  type: 'date',
                  label: 'Last Update',
                  admin: {
                    readOnly: true,
                    date: {
                      pickerAppearance: 'dayAndTime',
                    },
                  },
                },
              ],
            },
            {
              name: 'statusHistory',
              type: 'array',
              label: 'Status History',
              admin: {
                readOnly: true,
              },
              fields: [
                {
                  name: 'status',
                  type: 'text',
                },
                {
                  name: 'timestamp',
                  type: 'date',
                  admin: {
                    date: {
                      pickerAppearance: 'dayAndTime',
                    },
                  },
                },
                {
                  name: 'note',
                  type: 'text',
                },
              ],
            },
          ],
        },
        {
          label: 'Notes',
          fields: [
            {
              name: 'specialInstructions',
              type: 'textarea',
              label: 'Special Instructions',
              admin: {
                description: 'Special instructions for carrier (shown on rate confirmation)',
              },
            },
            {
              name: 'internalNotes',
              type: 'textarea',
              label: 'Internal Notes',
            },
            {
              name: 'dispatchNotes',
              type: 'textarea',
              label: 'Dispatch Notes',
            },
          ],
        },
        {
          label: 'DAT',
          fields: [
            {
              name: 'datPostingId',
              type: 'text',
              label: 'DAT Posting ID',
              admin: {
                readOnly: true,
                description: 'ID of the load posting on DAT load board',
              },
            },
            {
              name: 'datPosted',
              type: 'checkbox',
              label: 'Posted to DAT',
              defaultValue: false,
              admin: {
                readOnly: true,
              },
            },
          ],
        },
      ],
    },
  ],
  timestamps: true,
}
