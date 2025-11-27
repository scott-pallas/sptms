import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { profitability } from '@/lib/services/profitability'
import type { Load, Customer, Carrier } from '@/payload-types'

/**
 * GET /api/reports/profitability - Generate profitability report
 *
 * Query params:
 * - startDate: ISO date string (default: 30 days ago)
 * - endDate: ISO date string (default: today)
 * - customerId: Filter by specific customer
 * - carrierId: Filter by specific carrier
 * - type: 'summary' | 'loads' | 'customers' | 'carriers' | 'lanes' (default: summary)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const payload = await getPayload({ config: configPromise })

    // Parse date range
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0]
    const defaultStartDate = new Date()
    defaultStartDate.setDate(defaultStartDate.getDate() - 30)
    const startDate = searchParams.get('startDate') || defaultStartDate.toISOString().split('T')[0]

    // Parse filters
    const customerId = searchParams.get('customerId')
    const carrierId = searchParams.get('carrierId')
    const reportType = searchParams.get('type') || 'summary'

    // Build query
    const whereQuery: any = {
      createdAt: {
        greater_than_equal: new Date(startDate).toISOString(),
        less_than_equal: new Date(endDate + 'T23:59:59').toISOString(),
      },
    }

    if (customerId) {
      whereQuery.customer = { equals: customerId }
    }

    if (carrierId) {
      whereQuery.carrier = { equals: carrierId }
    }

    // Fetch loads
    const loadsResult = await payload.find({
      collection: 'loads',
      where: whereQuery,
      depth: 2,
      limit: 1000, // Reasonable limit for reporting
    })

    const loads = loadsResult.docs as Load[]

    // Build customer map for profitability calculations
    const customerIds = new Set<string>()
    const carrierIds = new Set<string>()

    for (const load of loads) {
      if (typeof load.customer === 'string') {
        customerIds.add(load.customer)
      } else if (load.customer?.id) {
        customerIds.add(load.customer.id)
      }

      if (typeof load.carrier === 'string') {
        carrierIds.add(load.carrier)
      } else if (load.carrier?.id) {
        carrierIds.add(load.carrier.id)
      }
    }

    // Fetch customers
    const customersMap = new Map<string, Customer>()
    if (customerIds.size > 0) {
      const customersResult = await payload.find({
        collection: 'customers',
        where: { id: { in: Array.from(customerIds) } },
        limit: customerIds.size,
      })
      for (const customer of customersResult.docs) {
        customersMap.set(customer.id, customer as Customer)
      }
    }

    // Fetch carriers
    const carriersMap = new Map<string, Carrier>()
    if (carrierIds.size > 0) {
      const carriersResult = await payload.find({
        collection: 'carriers',
        where: { id: { in: Array.from(carrierIds) } },
        limit: carrierIds.size,
      })
      for (const carrier of carriersResult.docs) {
        carriersMap.set(carrier.id, carrier as Carrier)
      }
    }

    // Generate report based on type
    let report: any

    switch (reportType) {
      case 'loads':
        report = profitability.calculateBatchProfitability(loads)
        break

      case 'customers':
        report = {
          customers: profitability.calculateCustomerProfitability(loads, customersMap),
          period: { startDate, endDate },
          totalLoads: loads.length,
        }
        break

      case 'carriers':
        report = {
          carriers: profitability.calculateCarrierProfitability(loads, carriersMap),
          period: { startDate, endDate },
          totalLoads: loads.length,
        }
        break

      case 'lanes':
        report = {
          lanes: profitability.calculateLaneProfitability(loads),
          period: { startDate, endDate },
          totalLoads: loads.length,
        }
        break

      case 'summary':
      default:
        report = profitability.generateSummary(
          loads,
          customersMap,
          startDate,
          endDate
        )
        break
    }

    return NextResponse.json({
      success: true,
      reportType,
      report,
    })
  } catch (error) {
    console.error('Error generating profitability report:', error)
    return NextResponse.json(
      { error: 'Failed to generate profitability report' },
      { status: 500 }
    )
  }
}
