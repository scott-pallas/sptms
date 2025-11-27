/**
 * DAT Market Rates API
 *
 * GET /api/dat/rates - Get market rates for a lane
 *
 * Query Parameters:
 * - originCity (required): Origin city
 * - originState (required): Origin state code
 * - destCity (required): Destination city
 * - destState (required): Destination state code
 * - equipmentType (required): Equipment type
 * - date: Specific date for rates (YYYY-MM-DD)
 * - targetMargin: Target margin as decimal (e.g., 0.15 for 15%)
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
    const equipmentType = url.searchParams.get('equipmentType')
    const date = url.searchParams.get('date')
    const targetMargin = url.searchParams.get('targetMargin')

    // Validate required parameters
    if (!originCity || !originState || !destCity || !destState || !equipmentType) {
      return NextResponse.json(
        {
          error: 'originCity, originState, destCity, destState, and equipmentType are required',
        },
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

    const result = await dat.getRates({
      origin: { city: originCity, state: originState },
      destination: { city: destCity, state: destState },
      equipmentType,
      date: date || undefined,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to get rates' },
        { status: 500 }
      )
    }

    // If target margin provided, also calculate suggested rates
    let suggestedRates = null
    if (targetMargin) {
      suggestedRates = await dat.getSuggestedRate(
        { city: originCity, state: originState },
        { city: destCity, state: destState },
        equipmentType,
        parseFloat(targetMargin)
      )
    }

    return NextResponse.json({
      success: true,
      rates: result.rates,
      suggestedRates,
    })
  } catch (error: any) {
    console.error('Error fetching DAT rates:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/dat/rates - Get rates with detailed parameters
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { origin, destination, equipmentType, date, targetMargin } = body

    // Validate required parameters
    if (!origin?.city || !origin?.state || !destination?.city || !destination?.state || !equipmentType) {
      return NextResponse.json(
        {
          error: 'origin, destination, and equipmentType are required',
        },
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

    const result = await dat.getRates({
      origin,
      destination,
      equipmentType,
      date,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to get rates' },
        { status: 500 }
      )
    }

    // Calculate suggested rates if target margin provided
    let suggestedRates = null
    if (targetMargin) {
      suggestedRates = await dat.getSuggestedRate(
        origin,
        destination,
        equipmentType,
        targetMargin
      )
    }

    return NextResponse.json({
      success: true,
      rates: result.rates,
      suggestedRates,
    })
  } catch (error: any) {
    console.error('Error fetching DAT rates:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
