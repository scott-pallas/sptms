import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { renderToBuffer } from '@react-pdf/renderer'
import { RateConfirmationPDF, type RateConfirmationProps } from '@/lib/pdf/rate-confirmation'
import type { Load, Carrier, Customer, CustomerLocation } from '@/payload-types'

// Broker information - could be moved to a global setting or env vars
const BROKER_INFO = {
  companyName: 'SPTMS Logistics',
  address: '123 Main Street',
  city: 'Dallas',
  state: 'TX',
  zip: '75001',
  phone: '(555) 123-4567',
  email: 'dispatch@sptms.com',
  mcNumber: '123456',
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payload = await getPayload({ config: configPromise })

    // Fetch the load with related data
    const load = await payload.findByID({
      collection: 'loads',
      id,
      depth: 2, // Get nested relationships
    }) as Load

    if (!load) {
      return NextResponse.json({ error: 'Load not found' }, { status: 404 })
    }

    // Get carrier - required for rate confirmation
    if (!load.carrier) {
      return NextResponse.json(
        { error: 'Load must have a carrier assigned to generate rate confirmation' },
        { status: 400 }
      )
    }

    const carrier = typeof load.carrier === 'string'
      ? await payload.findByID({ collection: 'carriers', id: load.carrier })
      : load.carrier as Carrier

    // Get customer
    const customer = typeof load.customer === 'string'
      ? await payload.findByID({ collection: 'customers', id: load.customer })
      : load.customer as Customer

    // Get pickup location if it's a relationship
    let pickupLocation: CustomerLocation | null = null
    if (load.pickupLocation) {
      pickupLocation = typeof load.pickupLocation === 'string'
        ? await payload.findByID({ collection: 'customer-locations', id: load.pickupLocation })
        : load.pickupLocation as CustomerLocation
    }

    // Get delivery location if it's a relationship
    let deliveryLocation: CustomerLocation | null = null
    if (load.deliveryLocation) {
      deliveryLocation = typeof load.deliveryLocation === 'string'
        ? await payload.findByID({ collection: 'customer-locations', id: load.deliveryLocation })
        : load.deliveryLocation as CustomerLocation
    }

    // Generate PDF
    const props: RateConfirmationProps = {
      load,
      carrier,
      customer,
      pickupLocation,
      deliveryLocation,
      brokerInfo: BROKER_INFO,
    }
    const pdfBuffer = await renderToBuffer(RateConfirmationPDF(props) as any)

    // Return PDF as download
    const filename = `RateCon-${load.loadNumber}-${carrier.companyName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating rate confirmation:', error)
    return NextResponse.json(
      { error: 'Failed to generate rate confirmation' },
      { status: 500 }
    )
  }
}
