import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { renderToBuffer } from '@react-pdf/renderer'
import { InvoicePDF, type InvoicePDFProps } from '@/lib/pdf/invoice'
import type { Customer, Invoice } from '@/payload-types'

// Broker information
const BROKER_INFO = {
  companyName: 'SPTMS Logistics',
  address: '123 Main Street',
  city: 'Dallas',
  state: 'TX',
  zip: '75001',
  phone: '(555) 123-4567',
  email: 'billing@sptms.com',
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payload = await getPayload({ config: configPromise })

    // Fetch the invoice with related data
    const invoiceDoc = await payload.findByID({
      collection: 'invoices',
      id,
      depth: 2,
    }) as Invoice | null

    if (!invoiceDoc) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const invoice = invoiceDoc

    // Get customer
    const customer = typeof invoice.customer === 'string'
      ? await payload.findByID({ collection: 'customers', id: invoice.customer }) as Customer
      : invoice.customer as Customer

    // Build invoice data for PDF
    const invoiceData: InvoicePDFProps['invoice'] = {
      invoiceNumber: invoice.invoiceNumber || '',
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate || undefined,
      paymentTerms: invoice.paymentTerms || undefined,
      lineItems: (invoice.lineItems || []).map((item: any) => ({
        description: item.description,
        quantity: item.quantity || 1,
        rate: item.rate,
        total: item.total,
      })),
      subtotal: invoice.subtotal || 0,
      total: invoice.total || 0,
      amountPaid: invoice.amountPaid || 0,
      balanceDue: invoice.balanceDue || (invoice.total || 0) - (invoice.amountPaid || 0),
      notes: invoice.notes || undefined,
      billingAddress: invoice.billingAddress ? {
        companyName: invoice.billingAddress.companyName || undefined,
        addressLine1: invoice.billingAddress.addressLine1 || undefined,
        addressLine2: invoice.billingAddress.addressLine2 || undefined,
        city: invoice.billingAddress.city || undefined,
        state: invoice.billingAddress.state || undefined,
        zipCode: invoice.billingAddress.zipCode || undefined,
      } : undefined,
    }

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      InvoicePDF({
        invoice: invoiceData,
        customer,
        brokerInfo: BROKER_INFO,
      }) as any
    )

    // Return PDF as download
    const filename = `Invoice-${invoice.invoiceNumber}.pdf`

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating invoice PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate invoice PDF' },
      { status: 500 }
    )
  }
}
