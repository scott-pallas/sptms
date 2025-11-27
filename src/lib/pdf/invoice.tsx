import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Customer } from '@/payload-types'

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  invoiceTitle: {
    flex: 1,
    textAlign: 'right',
  },
  invoiceLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  invoiceNumber: {
    fontSize: 12,
    marginTop: 4,
  },
  invoiceDate: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  addresses: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  addressBlock: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  addressText: {
    fontSize: 10,
    lineHeight: 1.4,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottom: '2px solid #000',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #eee',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableRowAlt: {
    backgroundColor: '#fafafa',
  },
  colDescription: {
    flex: 4,
  },
  colQty: {
    flex: 1,
    textAlign: 'center',
  },
  colRate: {
    flex: 1,
    textAlign: 'right',
  },
  colTotal: {
    flex: 1,
    textAlign: 'right',
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 10,
  },
  summary: {
    alignItems: 'flex-end',
    marginTop: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  summaryLabel: {
    width: 120,
    textAlign: 'right',
    paddingRight: 10,
  },
  summaryValue: {
    width: 100,
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    borderTop: '2px solid #000',
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    width: 120,
    textAlign: 'right',
    paddingRight: 10,
    fontWeight: 'bold',
    fontSize: 12,
  },
  totalValue: {
    width: 100,
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: 12,
  },
  balanceDue: {
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    color: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 8,
  },
  balanceLabel: {
    width: 110,
    textAlign: 'right',
    paddingRight: 10,
    fontWeight: 'bold',
    fontSize: 14,
  },
  balanceValue: {
    width: 100,
    textAlign: 'right',
    fontWeight: 'bold',
    fontSize: 14,
  },
  terms: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  termsTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  termsText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#666',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#999',
    fontSize: 9,
  },
  notes: {
    marginTop: 20,
    padding: 10,
    border: '1px solid #eee',
  },
  notesTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
})

export interface InvoicePDFProps {
  invoice: {
    invoiceNumber: string
    invoiceDate: string
    dueDate?: string
    paymentTerms?: string
    lineItems: Array<{
      description: string
      quantity?: number
      rate: number
      total?: number
    }>
    subtotal?: number
    total?: number
    amountPaid?: number
    balanceDue?: number
    notes?: string
    billingAddress?: {
      companyName?: string
      addressLine1?: string
      addressLine2?: string
      city?: string
      state?: string
      zipCode?: string
    }
  }
  customer: Customer
  brokerInfo: {
    companyName: string
    address: string
    city: string
    state: string
    zip: string
    phone: string
    email: string
  }
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

const paymentTermsLabels: Record<string, string> = {
  'due-on-receipt': 'Due on Receipt',
  'net-15': 'Net 15',
  'net-30': 'Net 30',
  'net-45': 'Net 45',
  'net-60': 'Net 60',
}

export const InvoicePDF: React.FC<InvoicePDFProps> = ({
  invoice,
  customer,
  brokerInfo,
}) => {
  const balanceDue = invoice.balanceDue ?? (invoice.total || 0) - (invoice.amountPaid || 0)

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{brokerInfo.companyName}</Text>
            <Text>{brokerInfo.address}</Text>
            <Text>{brokerInfo.city}, {brokerInfo.state} {brokerInfo.zip}</Text>
            <Text>{brokerInfo.phone}</Text>
            <Text>{brokerInfo.email}</Text>
          </View>
          <View style={styles.invoiceTitle}>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            <Text style={styles.invoiceDate}>Date: {formatDate(invoice.invoiceDate)}</Text>
            {invoice.dueDate && (
              <Text style={styles.invoiceDate}>Due: {formatDate(invoice.dueDate)}</Text>
            )}
            {invoice.paymentTerms && (
              <Text style={styles.invoiceDate}>
                Terms: {paymentTermsLabels[invoice.paymentTerms] || invoice.paymentTerms}
              </Text>
            )}
          </View>
        </View>

        {/* Bill To */}
        <View style={styles.addresses}>
          <View style={styles.addressBlock}>
            <Text style={styles.addressLabel}>Bill To</Text>
            <Text style={styles.addressText}>
              {invoice.billingAddress?.companyName || customer.companyName}
            </Text>
            {(invoice.billingAddress?.addressLine1 || customer.primaryContact) && (
              <Text style={styles.addressText}>
                {invoice.billingAddress?.addressLine1 || `Attn: ${customer.primaryContact}`}
              </Text>
            )}
            {invoice.billingAddress?.city && (
              <Text style={styles.addressText}>
                {invoice.billingAddress.city}, {invoice.billingAddress.state} {invoice.billingAddress.zipCode}
              </Text>
            )}
            {customer.billingEmail && (
              <Text style={styles.addressText}>{customer.billingEmail}</Text>
            )}
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colDescription, styles.headerText]}>Description</Text>
            <Text style={[styles.colQty, styles.headerText]}>Qty</Text>
            <Text style={[styles.colRate, styles.headerText]}>Rate</Text>
            <Text style={[styles.colTotal, styles.headerText]}>Amount</Text>
          </View>

          {invoice.lineItems.map((item, index) => (
            <View
              key={index}
              style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}
            >
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQty}>{item.quantity || 1}</Text>
              <Text style={styles.colRate}>{formatCurrency(item.rate)}</Text>
              <Text style={styles.colTotal}>
                {formatCurrency(item.total || (item.quantity || 1) * item.rate)}
              </Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(invoice.subtotal || 0)}</Text>
          </View>

          {(invoice.amountPaid || 0) > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Payments:</Text>
              <Text style={styles.summaryValue}>-{formatCurrency(invoice.amountPaid || 0)}</Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>{formatCurrency(invoice.total || 0)}</Text>
          </View>

          <View style={styles.balanceDue}>
            <Text style={styles.balanceLabel}>Balance Due:</Text>
            <Text style={styles.balanceValue}>{formatCurrency(balanceDue)}</Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Notes:</Text>
            <Text>{invoice.notes}</Text>
          </View>
        )}

        {/* Payment Terms */}
        <View style={styles.terms}>
          <Text style={styles.termsTitle}>Payment Information</Text>
          <Text style={styles.termsText}>
            Please make payment to {brokerInfo.companyName}. Payment is due by the date shown above.
            Please include the invoice number with your payment for proper credit.
          </Text>
          <Text style={[styles.termsText, { marginTop: 8 }]}>
            For questions regarding this invoice, please contact us at {brokerInfo.email} or {brokerInfo.phone}.
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Thank you for your business!
        </Text>
      </Page>
    </Document>
  )
}
