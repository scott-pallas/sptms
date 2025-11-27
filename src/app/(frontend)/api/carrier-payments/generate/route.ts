import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { Load, Carrier } from '@/payload-types'

/**
 * POST /api/carrier-payments/generate - Generate carrier pay sheet(s) from loads
 *
 * Body:
 * - loadIds: string[] - Array of load IDs
 * - carrierId?: string - Carrier ID (required if loads have different carriers)
 * - combineLoads?: boolean - Combine multiple loads into one pay sheet (default: true)
 * - paymentType?: 'standard' | 'quick-pay' | 'factoring' - Payment type
 */

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const body = await request.json()

    const { loadIds, carrierId, combineLoads = true, paymentType } = body

    if (!loadIds || !Array.isArray(loadIds) || loadIds.length === 0) {
      return NextResponse.json(
        { error: 'loadIds array is required' },
        { status: 400 }
      )
    }

    // Fetch all loads
    const loads: Load[] = []
    for (const loadId of loadIds) {
      const load = await payload.findByID({
        collection: 'loads',
        id: loadId,
        depth: 2,
      }) as Load

      if (!load) {
        return NextResponse.json(
          { error: `Load not found: ${loadId}` },
          { status: 404 }
        )
      }

      // Check if load has a carrier
      if (!load.carrier) {
        return NextResponse.json(
          { error: `Load ${load.loadNumber} has no carrier assigned` },
          { status: 400 }
        )
      }

      // Check if load is delivered or later
      const validStatuses = ['delivered', 'invoiced', 'paid']
      if (!validStatuses.includes(load.status)) {
        return NextResponse.json(
          { error: `Load ${load.loadNumber} has not been delivered yet (status: ${load.status})` },
          { status: 400 }
        )
      }

      loads.push(load)
    }

    // Validate all loads belong to same carrier if combining
    const carrierIds = new Set(
      loads.map(l => typeof l.carrier === 'string' ? l.carrier : (l.carrier as Carrier).id)
    )

    if (carrierIds.size > 1 && combineLoads) {
      return NextResponse.json(
        { error: 'Cannot combine loads from different carriers into one pay sheet' },
        { status: 400 }
      )
    }

    // Get carrier
    const firstLoad = loads[0]
    const carrier = typeof firstLoad.carrier === 'string'
      ? await payload.findByID({ collection: 'carriers', id: firstLoad.carrier })
      : firstLoad.carrier as Carrier

    // Determine payment type from carrier preference or request
    const effectivePaymentType = paymentType || carrier.paymentMethod || 'standard'

    // Build line items from loads
    const buildLineItems = (loadsToProcess: Load[]) => {
      const lineItems: any[] = []

      for (const load of loadsToProcess) {
        // Main line haul charge
        lineItems.push({
          description: `Line Haul: ${load.loadNumber} - ${getRouteDescription(load)}`,
          amount: load.carrierRate || 0,
          load: load.id,
          type: 'linehaul',
        })

        // Add accessorials paid to carrier
        if (load.accessorials) {
          for (const accessorial of load.accessorials) {
            if (accessorial.billTo === 'carrier') {
              const typeLabel = accessorial.type.charAt(0).toUpperCase() + accessorial.type.slice(1)
              lineItems.push({
                description: `${typeLabel}${accessorial.description ? `: ${accessorial.description}` : ''} (${load.loadNumber})`,
                amount: accessorial.amount,
                load: load.id,
                type: accessorial.type === 'detention' ? 'detention' :
                      accessorial.type === 'layover' ? 'layover' :
                      accessorial.type === 'lumper' ? 'lumper' : 'other',
              })
            }
          }
        }
      }

      return lineItems
    }

    const getRouteDescription = (load: Load): string => {
      const pickupCity = load.pickupAddress?.city || 'Origin'
      const pickupState = load.pickupAddress?.state || ''
      const deliveryCity = load.deliveryAddress?.city || 'Destination'
      const deliveryState = load.deliveryAddress?.state || ''

      return `${pickupCity}, ${pickupState} to ${deliveryCity}, ${deliveryState}`
    }

    // Calculate quick pay fee deduction if applicable
    const buildDeductions = (subtotal: number, payType: string, quickPayFeePercent: number = 3) => {
      const deductions: any[] = []

      if (payType === 'quick-pay') {
        const fee = Math.round(subtotal * (quickPayFeePercent / 100) * 100) / 100
        deductions.push({
          description: `Quick Pay Fee (${quickPayFeePercent}%)`,
          amount: fee,
          type: 'quick-pay-fee',
        })
      }

      return deductions
    }

    const paySheets: any[] = []

    if (combineLoads) {
      // Create single pay sheet for all loads
      const lineItems = buildLineItems(loads)
      const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0)
      const deductions = buildDeductions(subtotal, effectivePaymentType)

      const paySheet = await payload.create({
        collection: 'carrier-payments',
        data: {
          carrier: carrier.id,
          loads: loads.map(l => l.id),
          paymentType: effectivePaymentType,
          quickPayFee: effectivePaymentType === 'quick-pay' ? 3 : undefined,
          lineItems,
          deductions,
          status: 'pending',
          factoringCompany: effectivePaymentType === 'factoring' && carrier.factoringCompany
            ? { name: carrier.factoringCompany }
            : undefined,
        },
      })

      paySheets.push(paySheet)
    } else {
      // Create separate pay sheet for each load
      for (const load of loads) {
        const loadCarrier = typeof load.carrier === 'string'
          ? await payload.findByID({ collection: 'carriers', id: load.carrier })
          : load.carrier as Carrier

        const loadPaymentType = paymentType || loadCarrier.paymentMethod || 'standard'
        const lineItems = buildLineItems([load])
        const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0)
        const deductions = buildDeductions(subtotal, loadPaymentType)

        const paySheet = await payload.create({
          collection: 'carrier-payments',
          data: {
            carrier: loadCarrier.id,
            loads: [load.id],
            paymentType: loadPaymentType,
            quickPayFee: loadPaymentType === 'quick-pay' ? 3 : undefined,
            lineItems,
            deductions,
            status: 'pending',
            factoringCompany: loadPaymentType === 'factoring' && loadCarrier.factoringCompany
              ? { name: loadCarrier.factoringCompany }
              : undefined,
          },
        })

        paySheets.push(paySheet)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${paySheets.length} pay sheet(s)`,
      paySheets: paySheets.map(ps => ({
        id: ps.id,
        paySheetNumber: ps.paySheetNumber,
        total: ps.total,
        carrier: carrier.companyName,
        paymentType: ps.paymentType,
      })),
    })
  } catch (error) {
    console.error('Error generating carrier pay sheet:', error)
    return NextResponse.json(
      { error: 'Failed to generate carrier pay sheet' },
      { status: 500 }
    )
  }
}
