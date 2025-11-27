/**
 * DAT Rate History API
 *
 * GET /api/dat/rates/history - Get historical rate data for a lane
 *
 * Query Parameters:
 * - originCity (required): Origin city
 * - originState (required): Origin state code
 * - destCity (required): Destination city
 * - destState (required): Destination state code
 * - equipmentType (required): Equipment type
 * - days: Number of days of history (default: 90)
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
    const days = url.searchParams.get('days')

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

    const result = await dat.getLaneHistory(
      { city: originCity, state: originState },
      { city: destCity, state: destState },
      equipmentType,
      days ? parseInt(days) : 90
    )

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to get rate history' },
        { status: 500 }
      )
    }

    // Calculate some analytics
    const history = result.history
    const analytics = history.length > 0
      ? {
          averageSpotRate: history.reduce((sum, h) => sum + h.spotRate, 0) / history.length,
          minSpotRate: Math.min(...history.map(h => h.spotRate)),
          maxSpotRate: Math.max(...history.map(h => h.spotRate)),
          totalVolume: history.reduce((sum, h) => sum + (h.volume || 0), 0),
          latestRate: history[history.length - 1]?.spotRate,
          oldestRate: history[0]?.spotRate,
          percentChange: history.length > 1
            ? ((history[history.length - 1]?.spotRate - history[0]?.spotRate) / history[0]?.spotRate) * 100
            : 0,
        }
      : null

    return NextResponse.json({
      success: true,
      lane: result.lane,
      equipmentType: result.equipmentType,
      history: result.history,
      analytics,
    })
  } catch (error: any) {
    console.error('Error fetching DAT rate history:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
