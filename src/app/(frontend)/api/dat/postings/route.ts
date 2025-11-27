/**
 * DAT Load Postings API
 *
 * POST /api/dat/postings - Post a load to DAT
 * GET /api/dat/postings - Get my active postings
 */

import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { dat } from '@/lib/integrations/dat'
import type { Load, CustomerLocation } from '@/payload-types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { loadId, contactInfo } = body

    if (!loadId) {
      return NextResponse.json(
        { error: 'loadId is required' },
        { status: 400 }
      )
    }

    // Check if DAT is configured
    if (!dat.isConfigured()) {
      return NextResponse.json(
        { error: 'DAT integration is not configured' },
        { status: 503 }
      )
    }

    const payload = await getPayload({ config })

    // Fetch the load with relationships
    const load = await payload.findByID({
      collection: 'loads',
      id: loadId,
      depth: 2,
    }) as Load

    if (!load) {
      return NextResponse.json(
        { error: 'Load not found' },
        { status: 404 }
      )
    }

    // Get pickup and delivery locations if they're relationships
    let pickupLocation: CustomerLocation | null = null
    let deliveryLocation: CustomerLocation | null = null

    if (load.pickupLocation && typeof load.pickupLocation !== 'string') {
      pickupLocation = load.pickupLocation as CustomerLocation
    }

    if (load.deliveryLocation && typeof load.deliveryLocation !== 'string') {
      deliveryLocation = load.deliveryLocation as CustomerLocation
    }

    // Build and post to DAT
    const loadPost = dat.buildLoadPost(load, pickupLocation, deliveryLocation, contactInfo)
    const result = await dat.postLoad(loadPost)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to post load to DAT' },
        { status: 500 }
      )
    }

    // Store DAT posting ID on the load
    if (result.postingId) {
      await payload.update({
        collection: 'loads',
        id: loadId,
        data: {
          datPostingId: result.postingId,
          datPosted: true,
        },
      })
    }

    return NextResponse.json({
      success: true,
      postingId: result.postingId,
      matchingTrucks: result.matchingAssetCount,
      message: `Load ${load.loadNumber} posted to DAT successfully`,
    })
  } catch (error: any) {
    console.error('Error posting to DAT:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Check if DAT is configured
    if (!dat.isConfigured()) {
      return NextResponse.json(
        { error: 'DAT integration is not configured' },
        { status: 503 }
      )
    }

    const postings = await dat.getMyPostings()

    return NextResponse.json({
      success: true,
      postings,
      count: postings.length,
    })
  } catch (error: any) {
    console.error('Error fetching DAT postings:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
