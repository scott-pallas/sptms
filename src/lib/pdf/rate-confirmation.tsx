import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Load, Carrier, Customer, CustomerLocation } from '@/payload-types'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2px solid #000',
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  column: {
    flex: 1,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  value: {
    marginBottom: 4,
  },
  section: {
    marginBottom: 15,
    padding: 10,
    border: '1px solid #ccc',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
    borderBottom: '1px solid #ccc',
    paddingBottom: 4,
  },
  table: {
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #eee',
    paddingVertical: 4,
  },
  tableHeader: {
    fontWeight: 'bold',
    backgroundColor: '#f5f5f5',
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 4,
  },
  total: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
    paddingTop: 10,
    borderTop: '2px solid #000',
  },
  totalLabel: {
    fontWeight: 'bold',
    fontSize: 12,
    marginRight: 20,
  },
  totalValue: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
  },
  terms: {
    fontSize: 8,
    marginBottom: 20,
    lineHeight: 1.4,
  },
  signature: {
    flexDirection: 'row',
    marginTop: 30,
  },
  signatureLine: {
    flex: 1,
    borderTop: '1px solid #000',
    marginTop: 30,
    paddingTop: 4,
  },
  signatureLabel: {
    fontSize: 8,
  },
  loadInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  loadNumber: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 10,
  },
})

// Equipment type display mapping
const equipmentTypeLabels: Record<string, string> = {
  'dry-van': 'Dry Van',
  'reefer': 'Reefer',
  'flatbed': 'Flatbed',
  'step-deck': 'Step Deck',
  'power-only': 'Power Only',
  'hotshot': 'Hotshot',
  'box-truck': 'Box Truck',
}

export interface RateConfirmationProps {
  load: Load
  carrier: Carrier
  customer: Customer
  pickupLocation?: CustomerLocation | null
  deliveryLocation?: CustomerLocation | null
  brokerInfo: {
    companyName: string
    address: string
    city: string
    state: string
    zip: string
    phone: string
    email: string
    mcNumber: string
  }
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

const getPickupAddress = (load: Load, pickupLocation?: CustomerLocation | null) => {
  if (pickupLocation) {
    return {
      name: pickupLocation.locationName,
      address: pickupLocation.addressLine1,
      city: pickupLocation.city,
      state: pickupLocation.state,
      zip: pickupLocation.zipCode,
      contact: pickupLocation.contactName,
      phone: pickupLocation.contactPhone,
    }
  }
  if (load.pickupAddress) {
    return {
      name: load.pickupAddress.facilityName,
      address: load.pickupAddress.addressLine1,
      city: load.pickupAddress.city,
      state: load.pickupAddress.state,
      zip: load.pickupAddress.zipCode,
      contact: load.pickupAddress.contactName,
      phone: load.pickupAddress.contactPhone,
    }
  }
  return null
}

const getDeliveryAddress = (load: Load, deliveryLocation?: CustomerLocation | null) => {
  if (deliveryLocation) {
    return {
      name: deliveryLocation.locationName,
      address: deliveryLocation.addressLine1,
      city: deliveryLocation.city,
      state: deliveryLocation.state,
      zip: deliveryLocation.zipCode,
      contact: deliveryLocation.contactName,
      phone: deliveryLocation.contactPhone,
    }
  }
  if (load.deliveryAddress) {
    return {
      name: load.deliveryAddress.facilityName,
      address: load.deliveryAddress.addressLine1,
      city: load.deliveryAddress.city,
      state: load.deliveryAddress.state,
      zip: load.deliveryAddress.zipCode,
      contact: load.deliveryAddress.contactName,
      phone: load.deliveryAddress.contactPhone,
    }
  }
  return null
}

export const RateConfirmationPDF: React.FC<RateConfirmationProps> = ({
  load,
  carrier,
  customer,
  pickupLocation,
  deliveryLocation,
  brokerInfo,
}) => {
  const pickup = getPickupAddress(load, pickupLocation)
  const delivery = getDeliveryAddress(load, deliveryLocation)

  // Calculate total with accessorials
  const carrierAccessorials = load.accessorials?.filter(a => a.billTo === 'carrier') || []
  const accessorialTotal = carrierAccessorials.reduce((sum, a) => sum + a.amount, 0)
  const totalRate = (load.carrierRate || 0) + accessorialTotal

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>{brokerInfo.companyName}</Text>
          <Text>{brokerInfo.address}</Text>
          <Text>{brokerInfo.city}, {brokerInfo.state} {brokerInfo.zip}</Text>
          <Text>Phone: {brokerInfo.phone} | Email: {brokerInfo.email}</Text>
          <Text>MC# {brokerInfo.mcNumber}</Text>
        </View>

        <Text style={styles.title}>Rate Confirmation / Load Tender</Text>

        {/* Load Info */}
        <View style={styles.loadInfo}>
          <Text style={styles.loadNumber}>Load #: {load.loadNumber}</Text>
          <Text style={styles.date}>Date: {formatDate(new Date().toISOString())}</Text>
        </View>

        {/* Carrier Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Carrier Information</Text>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Carrier Name:</Text>
              <Text style={styles.value}>{carrier.companyName}</Text>
              <Text style={styles.label}>MC#:</Text>
              <Text style={styles.value}>{carrier.mcNumber}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Contact:</Text>
              <Text style={styles.value}>{carrier.primaryContact || '-'}</Text>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{carrier.phone || '-'}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>DOT#:</Text>
              <Text style={styles.value}>{carrier.dotNumber}</Text>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{carrier.dispatchEmail || carrier.email || '-'}</Text>
            </View>
          </View>
        </View>

        {/* Pickup & Delivery */}
        <View style={styles.row}>
          <View style={[styles.section, styles.column, { marginRight: 5 }]}>
            <Text style={styles.sectionTitle}>Pickup</Text>
            {pickup && (
              <>
                <Text style={styles.value}>{pickup.name}</Text>
                <Text style={styles.value}>{pickup.address}</Text>
                <Text style={styles.value}>{pickup.city}, {pickup.state} {pickup.zip}</Text>
                {pickup.contact && <Text style={styles.value}>Contact: {pickup.contact}</Text>}
                {pickup.phone && <Text style={styles.value}>Phone: {pickup.phone}</Text>}
              </>
            )}
            <Text style={[styles.label, { marginTop: 8 }]}>Date/Time:</Text>
            <Text style={styles.value}>{formatDateTime(load.pickupDate)}</Text>
            {load.pickupDateEnd && (
              <Text style={styles.value}>to {formatDateTime(load.pickupDateEnd)}</Text>
            )}
            {load.pickupAppointment && (
              <Text style={[styles.value, { fontWeight: 'bold' }]}>* APPOINTMENT REQUIRED *</Text>
            )}
            {load.pickupInstructions && (
              <>
                <Text style={[styles.label, { marginTop: 4 }]}>Instructions:</Text>
                <Text style={styles.value}>{load.pickupInstructions}</Text>
              </>
            )}
          </View>

          <View style={[styles.section, styles.column, { marginLeft: 5 }]}>
            <Text style={styles.sectionTitle}>Delivery</Text>
            {delivery && (
              <>
                <Text style={styles.value}>{delivery.name}</Text>
                <Text style={styles.value}>{delivery.address}</Text>
                <Text style={styles.value}>{delivery.city}, {delivery.state} {delivery.zip}</Text>
                {delivery.contact && <Text style={styles.value}>Contact: {delivery.contact}</Text>}
                {delivery.phone && <Text style={styles.value}>Phone: {delivery.phone}</Text>}
              </>
            )}
            <Text style={[styles.label, { marginTop: 8 }]}>Date/Time:</Text>
            <Text style={styles.value}>{formatDateTime(load.deliveryDate)}</Text>
            {load.deliveryDateEnd && (
              <Text style={styles.value}>to {formatDateTime(load.deliveryDateEnd)}</Text>
            )}
            {load.deliveryAppointment && (
              <Text style={[styles.value, { fontWeight: 'bold' }]}>* APPOINTMENT REQUIRED *</Text>
            )}
            {load.deliveryInstructions && (
              <>
                <Text style={[styles.label, { marginTop: 4 }]}>Instructions:</Text>
                <Text style={styles.value}>{load.deliveryInstructions}</Text>
              </>
            )}
          </View>
        </View>

        {/* Freight Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Freight Details</Text>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Equipment:</Text>
              <Text style={styles.value}>{equipmentTypeLabels[load.equipmentType] || load.equipmentType}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Weight:</Text>
              <Text style={styles.value}>{load.weight ? `${load.weight.toLocaleString()} lbs` : '-'}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Pallets:</Text>
              <Text style={styles.value}>{load.palletCount || '-'}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Length:</Text>
              <Text style={styles.value}>{load.length ? `${load.length} ft` : '-'}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={{ flex: 2 }}>
              <Text style={styles.label}>Commodity:</Text>
              <Text style={styles.value}>{load.commodity || 'General Freight'}</Text>
            </View>
            {load.temperature && (
              <View style={styles.column}>
                <Text style={styles.label}>Temperature:</Text>
                <Text style={styles.value}>{load.temperature}</Text>
              </View>
            )}
          </View>
          {load.specialRequirements && load.specialRequirements.length > 0 && (
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>Special Requirements:</Text>
                <Text style={styles.value}>{load.specialRequirements.join(', ')}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Reference Numbers */}
        {load.customerReferenceNumbers && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reference Numbers</Text>
            <View style={styles.row}>
              {load.customerReferenceNumbers.poNumber && (
                <View style={styles.column}>
                  <Text style={styles.label}>PO#:</Text>
                  <Text style={styles.value}>{load.customerReferenceNumbers.poNumber}</Text>
                </View>
              )}
              {load.customerReferenceNumbers.bolNumber && (
                <View style={styles.column}>
                  <Text style={styles.label}>BOL#:</Text>
                  <Text style={styles.value}>{load.customerReferenceNumbers.bolNumber}</Text>
                </View>
              )}
              {load.customerReferenceNumbers.proNumber && (
                <View style={styles.column}>
                  <Text style={styles.label}>PRO#:</Text>
                  <Text style={styles.value}>{load.customerReferenceNumbers.proNumber}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Rate Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rate Details</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, { flex: 3 }]}>Description</Text>
              <Text style={[styles.tableCell, { textAlign: 'right' }]}>Amount</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3 }]}>Line Haul</Text>
              <Text style={[styles.tableCell, { textAlign: 'right' }]}>
                {formatCurrency(load.carrierRate || 0)}
              </Text>
            </View>
            {carrierAccessorials.map((accessorial, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 3 }]}>
                  {accessorial.type.charAt(0).toUpperCase() + accessorial.type.slice(1)}
                  {accessorial.description ? ` - ${accessorial.description}` : ''}
                </Text>
                <Text style={[styles.tableCell, { textAlign: 'right' }]}>
                  {formatCurrency(accessorial.amount)}
                </Text>
              </View>
            ))}
          </View>
          <View style={styles.total}>
            <Text style={styles.totalLabel}>TOTAL:</Text>
            <Text style={styles.totalValue}>{formatCurrency(totalRate)}</Text>
          </View>
        </View>

        {/* Footer with Terms and Signature */}
        <View style={styles.footer}>
          <Text style={styles.terms}>
            TERMS AND CONDITIONS: Carrier agrees to pick up and deliver the above described freight in accordance with
            the terms and conditions herein. Carrier is responsible for any shortage, damage, or loss of freight.
            Carrier must provide proof of delivery (POD) to receive payment. Payment terms are Net 30 unless otherwise
            agreed. Carrier agrees to maintain proper insurance coverage. This rate confirmation is subject to broker's
            standard terms and conditions.
          </Text>

          <View style={styles.signature}>
            <View style={[styles.signatureLine, { marginRight: 40 }]}>
              <Text style={styles.signatureLabel}>Carrier Signature / Date</Text>
            </View>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureLabel}>Driver Name / Phone</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
