/**
 * Profitability Calculation Service
 *
 * Provides financial analysis and profitability calculations for loads,
 * customers, carriers, and lanes.
 */

import type { Load, Customer, Carrier } from '@/payload-types'

export interface LoadProfitability {
  loadId: string
  loadNumber: string
  customerRate: number
  carrierRate: number
  accessorialRevenue: number
  accessorialCost: number
  grossRevenue: number
  grossCost: number
  grossProfit: number
  marginPercent: number
  marginPerMile?: number
  revenuePerMile?: number
  costPerMile?: number
}

export interface CustomerProfitability {
  customerId: string
  customerName: string
  totalLoads: number
  totalRevenue: number
  totalCost: number
  totalProfit: number
  averageMarginPercent: number
  averageRevenuePerLoad: number
  averageProfitPerLoad: number
}

export interface CarrierProfitability {
  carrierId: string
  carrierName: string
  mcNumber: string
  totalLoads: number
  totalPaid: number
  averageRatePerLoad: number
  averageRatePerMile?: number
  onTimePercentage?: number
}

export interface LaneProfitability {
  originCity: string
  originState: string
  destinationCity: string
  destinationState: string
  totalLoads: number
  averageCustomerRate: number
  averageCarrierRate: number
  averageMargin: number
  averageMarginPercent: number
  averageMiles?: number
}

export interface ProfitabilitySummary {
  period: {
    startDate: string
    endDate: string
  }
  totalLoads: number
  totalRevenue: number
  totalCost: number
  grossProfit: number
  averageMarginPercent: number
  topCustomers: CustomerProfitability[]
  topLanes: LaneProfitability[]
  loadsByStatus: Record<string, number>
}

class ProfitabilityService {
  /**
   * Calculate profitability for a single load
   */
  calculateLoadProfitability(load: Load): LoadProfitability {
    const customerRate = load.customerRate || 0
    const carrierRate = load.carrierRate || 0

    // Calculate accessorial revenue and costs
    let accessorialRevenue = 0
    let accessorialCost = 0

    if (load.accessorials) {
      for (const accessorial of load.accessorials) {
        if (accessorial.billTo === 'customer') {
          accessorialRevenue += accessorial.amount
        } else if (accessorial.billTo === 'carrier') {
          accessorialCost += accessorial.amount
        }
      }
    }

    const grossRevenue = customerRate + accessorialRevenue
    const grossCost = carrierRate + accessorialCost
    const grossProfit = grossRevenue - grossCost
    const marginPercent = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0

    // Calculate per-mile metrics if miles available
    const miles = load.miles || 0
    const marginPerMile = miles > 0 ? grossProfit / miles : undefined
    const revenuePerMile = miles > 0 ? grossRevenue / miles : undefined
    const costPerMile = miles > 0 ? grossCost / miles : undefined

    return {
      loadId: load.id,
      loadNumber: load.loadNumber || '',
      customerRate,
      carrierRate,
      accessorialRevenue,
      accessorialCost,
      grossRevenue,
      grossCost,
      grossProfit,
      marginPercent: Math.round(marginPercent * 100) / 100,
      marginPerMile: marginPerMile ? Math.round(marginPerMile * 100) / 100 : undefined,
      revenuePerMile: revenuePerMile ? Math.round(revenuePerMile * 100) / 100 : undefined,
      costPerMile: costPerMile ? Math.round(costPerMile * 100) / 100 : undefined,
    }
  }

  /**
   * Calculate profitability across multiple loads
   */
  calculateBatchProfitability(loads: Load[]): {
    loads: LoadProfitability[]
    summary: {
      totalRevenue: number
      totalCost: number
      totalProfit: number
      averageMarginPercent: number
      totalMiles: number
      profitPerMile: number
    }
  } {
    const loadProfits = loads.map(load => this.calculateLoadProfitability(load))

    const totalRevenue = loadProfits.reduce((sum, lp) => sum + lp.grossRevenue, 0)
    const totalCost = loadProfits.reduce((sum, lp) => sum + lp.grossCost, 0)
    const totalProfit = totalRevenue - totalCost
    const averageMarginPercent = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
    const totalMiles = loads.reduce((sum, load) => sum + (load.miles || 0), 0)
    const profitPerMile = totalMiles > 0 ? totalProfit / totalMiles : 0

    return {
      loads: loadProfits,
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        averageMarginPercent: Math.round(averageMarginPercent * 100) / 100,
        totalMiles,
        profitPerMile: Math.round(profitPerMile * 100) / 100,
      },
    }
  }

  /**
   * Calculate profitability by customer
   */
  calculateCustomerProfitability(
    loads: Load[],
    customers: Map<string, Customer>
  ): CustomerProfitability[] {
    // Group loads by customer
    const customerLoads = new Map<string, Load[]>()

    for (const load of loads) {
      const customerId = typeof load.customer === 'string'
        ? load.customer
        : (load.customer as Customer)?.id

      if (customerId) {
        const existing = customerLoads.get(customerId) || []
        existing.push(load)
        customerLoads.set(customerId, existing)
      }
    }

    // Calculate profitability for each customer
    const results: CustomerProfitability[] = []

    for (const [customerId, custLoads] of customerLoads) {
      const customer = customers.get(customerId)
      const { summary } = this.calculateBatchProfitability(custLoads)

      results.push({
        customerId,
        customerName: customer?.companyName || 'Unknown',
        totalLoads: custLoads.length,
        totalRevenue: summary.totalRevenue,
        totalCost: summary.totalCost,
        totalProfit: summary.totalProfit,
        averageMarginPercent: summary.averageMarginPercent,
        averageRevenuePerLoad: Math.round((summary.totalRevenue / custLoads.length) * 100) / 100,
        averageProfitPerLoad: Math.round((summary.totalProfit / custLoads.length) * 100) / 100,
      })
    }

    // Sort by total profit descending
    return results.sort((a, b) => b.totalProfit - a.totalProfit)
  }

  /**
   * Calculate profitability by carrier
   */
  calculateCarrierProfitability(
    loads: Load[],
    carriers: Map<string, Carrier>
  ): CarrierProfitability[] {
    // Group loads by carrier
    const carrierLoads = new Map<string, Load[]>()

    for (const load of loads) {
      const carrierId = typeof load.carrier === 'string'
        ? load.carrier
        : (load.carrier as Carrier)?.id

      if (carrierId) {
        const existing = carrierLoads.get(carrierId) || []
        existing.push(load)
        carrierLoads.set(carrierId, existing)
      }
    }

    // Calculate profitability for each carrier
    const results: CarrierProfitability[] = []

    for (const [carrierId, carLoads] of carrierLoads) {
      const carrier = carriers.get(carrierId)
      const totalPaid = carLoads.reduce((sum, load) => {
        const carrierRate = load.carrierRate || 0
        // Add carrier accessorials
        const accessorialCost = (load.accessorials || [])
          .filter(a => a.billTo === 'carrier')
          .reduce((s, a) => s + a.amount, 0)
        return sum + carrierRate + accessorialCost
      }, 0)

      const totalMiles = carLoads.reduce((sum, load) => sum + (load.miles || 0), 0)

      results.push({
        carrierId,
        carrierName: carrier?.companyName || 'Unknown',
        mcNumber: carrier?.mcNumber || '',
        totalLoads: carLoads.length,
        totalPaid: Math.round(totalPaid * 100) / 100,
        averageRatePerLoad: Math.round((totalPaid / carLoads.length) * 100) / 100,
        averageRatePerMile: totalMiles > 0
          ? Math.round((totalPaid / totalMiles) * 100) / 100
          : undefined,
      })
    }

    // Sort by total paid descending
    return results.sort((a, b) => b.totalPaid - a.totalPaid)
  }

  /**
   * Calculate profitability by lane
   */
  calculateLaneProfitability(loads: Load[]): LaneProfitability[] {
    // Group loads by lane (origin state -> destination state for simplicity)
    const laneLoads = new Map<string, Load[]>()

    for (const load of loads) {
      const originCity = load.pickupAddress?.city || 'Unknown'
      const originState = load.pickupAddress?.state || 'XX'
      const destCity = load.deliveryAddress?.city || 'Unknown'
      const destState = load.deliveryAddress?.state || 'XX'

      // Use state-to-state as lane key
      const laneKey = `${originState}-${destState}`
      const existing = laneLoads.get(laneKey) || []
      existing.push(load)
      laneLoads.set(laneKey, existing)
    }

    // Calculate profitability for each lane
    const results: LaneProfitability[] = []

    for (const [_laneKey, laneLoadList] of laneLoads) {
      const { summary } = this.calculateBatchProfitability(laneLoadList)

      // Get most common origin/dest cities
      const firstLoad = laneLoadList[0]

      results.push({
        originCity: firstLoad.pickupAddress?.city || 'Unknown',
        originState: firstLoad.pickupAddress?.state || 'XX',
        destinationCity: firstLoad.deliveryAddress?.city || 'Unknown',
        destinationState: firstLoad.deliveryAddress?.state || 'XX',
        totalLoads: laneLoadList.length,
        averageCustomerRate: Math.round((summary.totalRevenue / laneLoadList.length) * 100) / 100,
        averageCarrierRate: Math.round((summary.totalCost / laneLoadList.length) * 100) / 100,
        averageMargin: Math.round((summary.totalProfit / laneLoadList.length) * 100) / 100,
        averageMarginPercent: summary.averageMarginPercent,
        averageMiles: summary.totalMiles > 0
          ? Math.round(summary.totalMiles / laneLoadList.length)
          : undefined,
      })
    }

    // Sort by average margin descending
    return results.sort((a, b) => b.averageMargin - a.averageMargin)
  }

  /**
   * Generate full profitability summary
   */
  generateSummary(
    loads: Load[],
    customers: Map<string, Customer>,
    startDate: string,
    endDate: string
  ): ProfitabilitySummary {
    const { summary } = this.calculateBatchProfitability(loads)
    const customerProfits = this.calculateCustomerProfitability(loads, customers)
    const laneProfits = this.calculateLaneProfitability(loads)

    // Count loads by status
    const loadsByStatus: Record<string, number> = {}
    for (const load of loads) {
      const status = load.status || 'unknown'
      loadsByStatus[status] = (loadsByStatus[status] || 0) + 1
    }

    return {
      period: {
        startDate,
        endDate,
      },
      totalLoads: loads.length,
      totalRevenue: summary.totalRevenue,
      totalCost: summary.totalCost,
      grossProfit: summary.totalProfit,
      averageMarginPercent: summary.averageMarginPercent,
      topCustomers: customerProfits.slice(0, 10),
      topLanes: laneProfits.slice(0, 10),
      loadsByStatus,
    }
  }

  /**
   * Calculate target margin requirements
   */
  calculateTargetRate(
    carrierRate: number,
    targetMarginPercent: number
  ): {
    minimumCustomerRate: number
    targetProfit: number
  } {
    // margin = (revenue - cost) / revenue
    // margin * revenue = revenue - cost
    // cost = revenue * (1 - margin)
    // revenue = cost / (1 - margin)
    const minimumCustomerRate = carrierRate / (1 - targetMarginPercent / 100)

    return {
      minimumCustomerRate: Math.round(minimumCustomerRate * 100) / 100,
      targetProfit: Math.round((minimumCustomerRate - carrierRate) * 100) / 100,
    }
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  /**
   * Format percentage for display
   */
  formatPercent(percent: number): string {
    return `${percent.toFixed(2)}%`
  }
}

// Export singleton instance
export const profitability = new ProfitabilityService()

// Export class for testing
export { ProfitabilityService }
