import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { Load, Customer } from '@/payload-types'

/**
 * POST /api/invoices/generate - Generate invoice(s) from loads
 *
 * Body:
 * - loadIds: string[] - Array of load IDs to invoice
 * - customerId?: string - Customer ID (required if loads have different customers)
 * - combineLoads?: boolean - Combine multiple loads into one invoice (default: true)
 */

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const body = await request.json()

    const { loadIds, customerId, combineLoads = true } = body

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

      // Check if load is already invoiced
      if (load.status === 'invoiced' || load.status === 'paid') {
        return NextResponse.json(
          { error: `Load ${load.loadNumber} is already invoiced` },
          { status: 400 }
        )
      }

      // Check load has been delivered
      if (load.status !== 'delivered') {
        return NextResponse.json(
          { error: `Load ${load.loadNumber} has not been delivered yet (status: ${load.status})` },
          { status: 400 }
        )
      }

      loads.push(load)
    }

    // Validate all loads belong to same customer if combining
    const customerIds = new Set(
      loads.map(l => typeof l.customer === 'string' ? l.customer : l.customer.id)
    )

    if (customerIds.size > 1 && combineLoads) {
      return NextResponse.json(
        { error: 'Cannot combine loads from different customers into one invoice' },
        { status: 400 }
      )
    }

    // Get customer
    const firstLoad = loads[0]
    const customer = typeof firstLoad.customer === 'string'
      ? await payload.findByID({ collection: 'customers', id: firstLoad.customer })
      : firstLoad.customer as Customer

    // Build line items from loads
    const buildLineItems = (loadsToInvoice: Load[]) => {
      const lineItems: any[] = []

      for (const load of loadsToInvoice) {
        // Main line haul charge
        lineItems.push({
          description: `Freight: ${load.loadNumber} - ${getRouteDescription(load)}`,
          quantity: 1,
          rate: load.customerRate,
          load: load.id,
        })

        // Add accessorials billed to customer
        if (load.accessorials) {
          for (const accessorial of load.accessorials) {
            if (accessorial.billTo === 'customer') {
              lineItems.push({
                description: `${accessorial.type.charAt(0).toUpperCase() + accessorial.type.slice(1)}${accessorial.description ? `: ${accessorial.description}` : ''} (${load.loadNumber})`,
                quantity: 1,
                rate: accessorial.amount,
                load: load.id,
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

    const invoices: any[] = []

    if (combineLoads) {
      // Create single invoice for all loads
      const lineItems = buildLineItems(loads)

      const invoice = await payload.create({
        collection: 'invoices',
        data: {
          customer: customer.id,
          loads: loads.map(l => l.id),
          invoiceDate: new Date().toISOString(),
          paymentTerms: customer.paymentTerms || 'net-30',
          lineItems,
          billingAddress: {
            companyName: customer.companyName,
          },
          status: 'draft',
        },
      })

      invoices.push(invoice)

      // Update loads to invoiced status
      for (const load of loads) {
        await payload.update({
          collection: 'loads',
          id: load.id,
          data: { status: 'invoiced' },
        })
      }
    } else {
      // Create separate invoice for each load
      for (const load of loads) {
        const loadCustomer = typeof load.customer === 'string'
          ? await payload.findByID({ collection: 'customers', id: load.customer })
          : load.customer as Customer

        const lineItems = buildLineItems([load])

        const invoice = await payload.create({
          collection: 'invoices',
          data: {
            customer: loadCustomer.id,
            loads: [load.id],
            invoiceDate: new Date().toISOString(),
            paymentTerms: loadCustomer.paymentTerms || 'net-30',
            lineItems,
            billingAddress: {
              companyName: loadCustomer.companyName,
            },
            status: 'draft',
          },
        })

        invoices.push(invoice)

        // Update load to invoiced status
        await payload.update({
          collection: 'loads',
          id: load.id,
          data: { status: 'invoiced' },
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${invoices.length} invoice(s)`,
      invoices: invoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        total: inv.total,
        customer: customer.companyName,
      })),
    })
  } catch (error) {
    console.error('Error generating invoice:', error)
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    )
  }
}
