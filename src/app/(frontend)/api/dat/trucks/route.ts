/**
 * DAT Truck Search API
 *
 * GET /api/dat/trucks - Search for available trucks
 *
 * Query Parameters:
 * - originCity (required): Origin city
 * - originState (required): Origin state code
 * - destCity: Destination city
 * - destState: Destination state code
 * - equipmentTypes: Comma-separated equipment types
 * - availableDate: Available date (YYYY-MM-DD)
 * - originRadius: Max miles from origin (default: 100)
 * - destRadius: Max miles from destination (default: 100)
 * - limit: Max results (default: 50)
 */

import { NextResponse } from 'next/server'
import { dat } from '@/lib/integrations/dat'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const originCity = url.searchParams.get('originCity')
    const originState = url.searchParams.get('originState')
    const destCity = url.searchParams.get('destCity')
    const destState = url.searchParams.get('destState')
    const equipmentTypes = url.searchParams.get('equipmentTypes')
    const availableDate = url.searchParams.get('availableDate')
    const originRadius = url.searchParams.get('originRadius')
    const destRadius = url.searchParams.get('destRadius')
    const limit = url.searchParams.get('limit')

    // Validate required parameters
    if (!originCity || !originState) {
      return NextResponse.json(
        { error: 'originCity and originState are required' },
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

    const result = await dat.searchTrucks({
      origin: {
        city: originCity,
        state: originState,
        radius: originRadius ? parseInt(originRadius) : undefined,
      },
      destination: destCity && destState
        ? {
            city: destCity,
            state: destState,
            radius: destRadius ? parseInt(destRadius) : undefined,
          }
        : undefined,
      equipmentTypes: equipmentTypes ? equipmentTypes.split(',') : undefined,
      availableDate: availableDate || undefined,
      limit: limit ? parseInt(limit) : undefined,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to search trucks' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      trucks: result.trucks,
      totalCount: result.totalCount,
    })
  } catch (error: any) {
    console.error('Error searching DAT trucks:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/dat/trucks - Search with more complex criteria
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      origin,
      destination,
      equipmentTypes,
      availableDate,
      deadheadOrigin,
      deadheadDestination,
      limit,
    } = body

    // Validate required parameters
    if (!origin?.city || !origin?.state) {
      return NextResponse.json(
        { error: 'origin.city and origin.state are required' },
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

    const result = await dat.searchTrucks({
      origin,
      destination,
      equipmentTypes,
      availableDate,
      deadheadOrigin,
      deadheadDestination,
      limit,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to search trucks' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      trucks: result.trucks,
      totalCount: result.totalCount,
    })
  } catch (error: any) {
    console.error('Error searching DAT trucks:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
