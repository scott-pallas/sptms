import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { macropoint } from '@/lib/integrations/macropoint'
import type { Load, Carrier, CustomerLocation } from '@/payload-types'

/**
 * POST /api/loads/[id]/tracking - Start tracking for a load
 * GET /api/loads/[id]/tracking - Get tracking status and history
 * DELETE /api/loads/[id]/tracking - Cancel tracking
 */

export async function POST(
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
      depth: 2,
    }) as Load

    if (!load) {
      return NextResponse.json({ error: 'Load not found' }, { status: 404 })
    }

    // Check if carrier is assigned
    if (!load.carrier) {
      return NextResponse.json(
        { error: 'Load must have a carrier assigned to initiate tracking' },
        { status: 400 }
      )
    }

    // Check if tracking is already active
    if (load.macropointTracking?.trackingActive) {
      return NextResponse.json(
        { error: 'Tracking is already active for this load', trackingId: load.macropointTracking.trackingId },
        { status: 400 }
      )
    }

    const carrier = typeof load.carrier === 'string'
      ? await payload.findByID({ collection: 'carriers', id: load.carrier })
      : load.carrier as Carrier

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

    // Create tracking request with MacroPoint
    const result = await macropoint.createTrackingRequest(
      load,
      carrier,
      pickupLocation,
      deliveryLocation
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create tracking request' },
        { status: 500 }
      )
    }

    // Update load with tracking info
    await payload.update({
      collection: 'loads',
      id,
      data: {
        macropointTracking: {
          trackingId: result.trackingId || result.orderId,
          trackingActive: true,
          lastUpdate: new Date().toISOString(),
        },
      },
    })

    // Create initial tracking event
    await payload.create({
      collection: 'tracking-events',
      data: {
        load: id,
        eventType: 'in-transit',
        timestamp: new Date().toISOString(),
        source: 'macropoint',
        macropointData: {
          orderId: result.orderId,
        },
        notes: 'Tracking initiated',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Tracking initiated successfully',
      trackingId: result.trackingId || result.orderId,
    })
  } catch (error) {
    console.error('Error initiating tracking:', error)
    return NextResponse.json(
      { error: 'Failed to initiate tracking' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payload = await getPayload({ config: configPromise })

    // Fetch the load
    const load = await payload.findByID({
      collection: 'loads',
      id,
    }) as Load

    if (!load) {
      return NextResponse.json({ error: 'Load not found' }, { status: 404 })
    }

    // Get tracking events for this load
    const trackingEvents = await payload.find({
      collection: 'tracking-events',
      where: {
        load: { equals: id },
      },
      sort: '-timestamp',
      limit: 50,
    })

    // Get current status from MacroPoint if tracking is active
    let currentStatus = null
    if (load.macropointTracking?.trackingActive && load.macropointTracking?.trackingId) {
      const status = await macropoint.getTrackingStatus(load.macropointTracking.trackingId)
      if (status.success) {
        currentStatus = status
      }
    }

    return NextResponse.json({
      load: {
        id: load.id,
        loadNumber: load.loadNumber,
        status: load.status,
      },
      tracking: {
        active: load.macropointTracking?.trackingActive || false,
        trackingId: load.macropointTracking?.trackingId,
        lastLocation: load.macropointTracking?.lastLocation,
        lastUpdate: load.macropointTracking?.lastUpdate,
        currentStatus,
      },
      events: trackingEvents.docs,
    })
  } catch (error) {
    console.error('Error fetching tracking:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tracking information' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const payload = await getPayload({ config: configPromise })

    // Fetch the load
    const load = await payload.findByID({
      collection: 'loads',
      id,
    }) as Load

    if (!load) {
      return NextResponse.json({ error: 'Load not found' }, { status: 404 })
    }

    if (!load.macropointTracking?.trackingActive) {
      return NextResponse.json(
        { error: 'Tracking is not active for this load' },
        { status: 400 }
      )
    }

    // Cancel tracking with MacroPoint
    if (load.macropointTracking?.trackingId) {
      await macropoint.cancelTracking(load.macropointTracking.trackingId)
    }

    // Update load
    await payload.update({
      collection: 'loads',
      id,
      data: {
        macropointTracking: {
          ...load.macropointTracking,
          trackingActive: false,
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Tracking cancelled',
    })
  } catch (error) {
    console.error('Error cancelling tracking:', error)
    return NextResponse.json(
      { error: 'Failed to cancel tracking' },
      { status: 500 }
    )
  }
}
