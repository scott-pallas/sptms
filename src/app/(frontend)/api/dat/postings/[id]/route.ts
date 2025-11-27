/**
 * DAT Load Posting by ID API
 *
 * PUT /api/dat/postings/[id] - Update a posting
 * DELETE /api/dat/postings/[id] - Remove a posting from DAT
 */

import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { dat } from '@/lib/integrations/dat'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postingId } = await params
    const body = await request.json()

    if (!postingId) {
      return NextResponse.json(
        { error: 'Posting ID is required' },
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

    const result = await dat.updateLoadPost(postingId, body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update posting' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      postingId,
      message: 'Posting updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating DAT posting:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postingId } = await params
    const url = new URL(request.url)
    const loadId = url.searchParams.get('loadId')

    if (!postingId) {
      return NextResponse.json(
        { error: 'Posting ID is required' },
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

    const result = await dat.removeLoadPost(postingId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to remove posting' },
        { status: 500 }
      )
    }

    // Clear DAT posting ID from the load if loadId provided
    if (loadId) {
      const payload = await getPayload({ config })
      await payload.update({
        collection: 'loads',
        id: loadId,
        data: {
          datPostingId: null,
          datPosted: false,
        },
      })
    }

    return NextResponse.json({
      success: true,
      postingId,
      message: 'Posting removed from DAT successfully',
    })
  } catch (error: any) {
    console.error('Error removing DAT posting:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
