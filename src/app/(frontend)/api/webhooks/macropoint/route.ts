import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { macropoint } from '@/lib/integrations/macropoint'
import type { Load } from '@/payload-types'

/**
 * POST /api/webhooks/macropoint - Handle incoming MacroPoint tracking updates
 *
 * MacroPoint sends webhooks with location updates and events.
 * This endpoint processes them and updates the load/tracking records.
 */

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })

    // Parse the incoming webhook payload
    const rawPayload = await request.json()

    // Log incoming webhook for debugging
    console.log('MacroPoint webhook received:', JSON.stringify(rawPayload, null, 2))

    // Parse the payload into our format
    const update = macropoint.parseWebhookPayload(rawPayload)

    if (!update) {
      console.error('Failed to parse MacroPoint webhook payload')
      return NextResponse.json(
        { error: 'Invalid payload format' },
        { status: 400 }
      )
    }

    // Find the load by MacroPoint order ID (which is our load ID)
    // Try to find by tracking ID first, then by load ID
    let load: Load | null = null

    // First try to find by macropointTracking.trackingId
    const loadsByTrackingId = await payload.find({
      collection: 'loads',
      where: {
        'macropointTracking.trackingId': { equals: update.orderId },
      },
      limit: 1,
    })

    if (loadsByTrackingId.docs.length > 0) {
      load = loadsByTrackingId.docs[0] as Load
    } else {
      // Try to find by load ID directly
      try {
        load = await payload.findByID({
          collection: 'loads',
          id: update.orderId,
        }) as Load
      } catch {
        // Not a valid ID format
      }
    }

    if (!load) {
      console.error(`Load not found for MacroPoint order ID: ${update.orderId}`)
      // Return 200 to acknowledge receipt, but log the error
      return NextResponse.json({
        received: true,
        processed: false,
        error: 'Load not found',
      })
    }

    // Map event code to our event type
    const eventType = macropoint.mapEventCodeToType(update.eventCode) as
      | 'location'
      | 'arrived-pickup'
      | 'departed-pickup'
      | 'arrived-delivery'
      | 'departed-delivery'
      | 'in-transit'
      | 'delay'
      | 'exception'

    // Create tracking event record
    await payload.create({
      collection: 'tracking-events',
      data: {
        load: load.id,
        eventType,
        timestamp: update.eventTime,
        location: {
          latitude: update.latitude,
          longitude: update.longitude,
          city: update.city,
          state: update.state,
          address: update.address,
        },
        source: 'macropoint',
        macropointData: {
          orderId: update.orderId,
          eventCode: update.eventCode,
          rawPayload,
        },
        eta: update.eta ? {
          estimatedArrival: update.eta.arrival,
          milesRemaining: update.eta.milesRemaining,
          minutesRemaining: update.eta.minutesRemaining,
        } : undefined,
      },
    })

    // Build location string for display
    const locationParts = []
    if (update.city) locationParts.push(update.city)
    if (update.state) locationParts.push(update.state)
    const locationString = locationParts.length > 0
      ? locationParts.join(', ')
      : update.latitude && update.longitude
        ? `${update.latitude}, ${update.longitude}`
        : 'Unknown'

    // Update load with latest tracking info
    const loadUpdate: Record<string, any> = {
      macropointTracking: {
        ...load.macropointTracking,
        lastLocation: locationString,
        lastUpdate: update.eventTime,
      },
    }

    // Check if this event should update load status
    const statusUpdate = macropoint.shouldUpdateLoadStatus(update.eventCode)
    if (statusUpdate.update && statusUpdate.newStatus) {
      // Only update if it's a forward progression
      const statusOrder = ['booked', 'dispatched', 'in-transit', 'delivered', 'invoiced', 'paid']
      const currentIndex = statusOrder.indexOf(load.status)
      const newIndex = statusOrder.indexOf(statusUpdate.newStatus)

      if (newIndex > currentIndex) {
        loadUpdate.status = statusUpdate.newStatus
        console.log(`Auto-updating load ${load.loadNumber} status from ${load.status} to ${statusUpdate.newStatus}`)
      }
    }

    // Update driver info if provided
    if (update.driver?.name || update.driver?.phone) {
      loadUpdate.driverInfo = {
        ...load.driverInfo,
        driverName: update.driver.name || load.driverInfo?.driverName,
        driverPhone: update.driver.phone || load.driverInfo?.driverPhone,
      }
    }

    await payload.update({
      collection: 'loads',
      id: load.id,
      data: loadUpdate,
    })

    return NextResponse.json({
      received: true,
      processed: true,
      loadNumber: load.loadNumber,
      eventType,
      location: locationString,
    })
  } catch (error) {
    console.error('Error processing MacroPoint webhook:', error)
    // Return 200 to prevent retries, but log the error
    return NextResponse.json({
      received: true,
      processed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

// Handle GET for webhook verification (some services require this)
export async function GET(request: NextRequest) {
  // Echo back any challenge parameter for webhook verification
  const { searchParams } = new URL(request.url)
  const challenge = searchParams.get('challenge')

  if (challenge) {
    return NextResponse.json({ challenge })
  }

  return NextResponse.json({
    service: 'MacroPoint Webhook Handler',
    status: 'active',
  })
}
