import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { Resend } from 'resend'
import { renderToBuffer } from '@react-pdf/renderer'
import { render } from '@react-email/render'
import { RateConfirmationPDF, type RateConfirmationProps } from '@/lib/pdf/rate-confirmation'
import { RateConfirmationEmail } from '@/lib/email/rate-confirmation-email'
import type { Load, Carrier, Customer, CustomerLocation } from '@/payload-types'

const resend = new Resend(process.env.RESEND_API_KEY)

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payload = await getPayload({ config: configPromise })

    // Check for Resend API key
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Email service not configured. Please set RESEND_API_KEY.' },
        { status: 500 }
      )
    }

    // Fetch the load with related data
    const load = await payload.findByID({
      collection: 'loads',
      id,
      depth: 2,
    }) as Load

    if (!load) {
      return NextResponse.json({ error: 'Load not found' }, { status: 404 })
    }

    // Get carrier - required for rate confirmation
    if (!load.carrier) {
      return NextResponse.json(
        { error: 'Load must have a carrier assigned to send rate confirmation' },
        { status: 400 }
      )
    }

    const carrier = typeof load.carrier === 'string'
      ? await payload.findByID({ collection: 'carriers', id: load.carrier })
      : load.carrier as Carrier

    // Check carrier has email
    const carrierEmail = carrier.dispatchEmail || carrier.email
    if (!carrierEmail) {
      return NextResponse.json(
        { error: 'Carrier does not have an email address configured' },
        { status: 400 }
      )
    }

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

    // Determine pickup/delivery cities for email
    const pickupCity = pickupLocation?.city || load.pickupAddress?.city || 'TBD'
    const pickupState = pickupLocation?.state || load.pickupAddress?.state || ''
    const deliveryCity = deliveryLocation?.city || load.deliveryAddress?.city || 'TBD'
    const deliveryState = deliveryLocation?.state || load.deliveryAddress?.state || ''

    // Generate PDF
    const pdfProps: RateConfirmationProps = {
      load,
      carrier,
      customer,
      pickupLocation,
      deliveryLocation,
      brokerInfo: BROKER_INFO,
    }
    const pdfBuffer = await renderToBuffer(RateConfirmationPDF(pdfProps) as any)

    // Render email HTML
    const emailHtml = await render(
      RateConfirmationEmail({
        load,
        carrier,
        customer,
        pickupCity,
        pickupState,
        deliveryCity,
        deliveryState,
        brokerInfo: BROKER_INFO,
      }) as any
    )

    // Send email with PDF attachment
    const filename = `RateCon-${load.loadNumber}.pdf`
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'dispatch@sptms.com',
      to: carrierEmail,
      subject: `Rate Confirmation - Load #${load.loadNumber} | ${pickupCity}, ${pickupState} to ${deliveryCity}, ${deliveryState}`,
      html: emailHtml,
      attachments: [
        {
          filename,
          content: pdfBuffer.toString('base64'),
        },
      ],
    })

    if (error) {
      console.error('Failed to send email:', error)
      return NextResponse.json(
        { error: 'Failed to send email', details: error.message },
        { status: 500 }
      )
    }

    // Update load to mark rate con as sent
    await payload.update({
      collection: 'loads',
      id,
      data: {
        rateConSent: true,
        rateConSentDate: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      success: true,
      message: `Rate confirmation sent to ${carrierEmail}`,
      emailId: data?.id,
    })
  } catch (error) {
    console.error('Error sending rate confirmation:', error)
    return NextResponse.json(
      { error: 'Failed to send rate confirmation' },
      { status: 500 }
    )
  }
}
