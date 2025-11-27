/**
 * DAT Load Board Integration Service
 *
 * Integrates with DAT for:
 * - Load posting to DAT load board
 * - Searching for available trucks
 * - Market rate data (spot and contract rates)
 * - Rate trending and analytics
 *
 * Environment Variables Required:
 * - DAT_API_URL: DAT API endpoint (default: https://api.dat.com)
 * - DAT_CLIENT_ID: OAuth2 Client ID from DAT developer portal
 * - DAT_CLIENT_SECRET: OAuth2 Client Secret
 * - DAT_USERNAME: DAT account username (for Connexion login)
 * - DAT_PASSWORD: DAT account password
 *
 * Requirements:
 * - Connexion seat + load board seat for posting/searching
 * - RateView subscription for market rate data
 *
 * API Documentation: https://developer.dat.com
 */

import type { Load, CustomerLocation } from '@/payload-types'

const DAT_API_URL = process.env.DAT_API_URL || 'https://api.dat.com'
const DAT_CLIENT_ID = process.env.DAT_CLIENT_ID
const DAT_CLIENT_SECRET = process.env.DAT_CLIENT_SECRET
const DAT_USERNAME = process.env.DAT_USERNAME
const DAT_PASSWORD = process.env.DAT_PASSWORD

// Equipment type mapping to DAT codes
export const EQUIPMENT_TYPE_MAP: Record<string, string> = {
  'dry-van': 'V',
  'reefer': 'R',
  'flatbed': 'F',
  'step-deck': 'SD',
  'lowboy': 'LB',
  'power-only': 'PO',
  'box-truck': 'SB',
  'hotshot': 'HS',
  'tanker': 'T',
  'intermodal': 'IM',
  'other': 'O',
}

export interface DATCredentials {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export interface DATLoadPost {
  postingId?: string
  referenceNumber: string
  origin: {
    city: string
    state: string
    zipCode?: string
    radius?: number // miles
  }
  destination: {
    city: string
    state: string
    zipCode?: string
    radius?: number // miles
  }
  pickupDate: string
  deliveryDate?: string
  equipmentType: string
  length?: number // feet
  weight?: number // pounds
  rate?: number
  rateType?: 'flat' | 'per-mile'
  commodity?: string
  comments?: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  isTeamRequired?: boolean
  isHazmat?: boolean
  pieces?: number
  fullPartial?: 'full' | 'partial'
}

export interface DATLoadPostResponse {
  success: boolean
  postingId?: string
  matchingAssetCount?: number
  error?: string
  message?: string
}

export interface DATTruckSearch {
  origin: {
    city: string
    state: string
    radius?: number
  }
  destination?: {
    city: string
    state: string
    radius?: number
  }
  equipmentTypes?: string[]
  availableDate?: string
  deadheadOrigin?: number // max deadhead miles
  deadheadDestination?: number
  limit?: number
}

export interface DATTruck {
  postingId: string
  carrier: {
    name: string
    mcNumber?: string
    dotNumber?: string
    phone?: string
    email?: string
    rating?: number
    authorityAge?: number // months
  }
  equipment: {
    type: string
    length?: number
  }
  location: {
    city: string
    state: string
    zipCode?: string
  }
  destination?: {
    city: string
    state: string
    preferredLanes?: string[]
  }
  availableDate: string
  comments?: string
}

export interface DATTruckSearchResponse {
  success: boolean
  trucks?: DATTruck[]
  totalCount?: number
  error?: string
}

export interface DATRateRequest {
  origin: {
    city: string
    state: string
  }
  destination: {
    city: string
    state: string
  }
  equipmentType: string
  date?: string // for date-specific rates
}

export interface DATRateResponse {
  success: boolean
  rates?: {
    spotRate: {
      low: number
      average: number
      high: number
      perMile: number
      totalMiles: number
      sampleSize?: number
    }
    contractRate?: {
      low: number
      average: number
      high: number
      perMile: number
    }
    fuelSurcharge?: number
    trend?: {
      direction: 'up' | 'down' | 'stable'
      percentChange: number
      period: string
    }
  }
  error?: string
}

export interface DATLaneHistory {
  lane: {
    origin: { city: string; state: string }
    destination: { city: string; state: string }
  }
  equipmentType: string
  history: Array<{
    date: string
    spotRate: number
    contractRate?: number
    volume?: number
    fuelPrice?: number
  }>
}

class DATService {
  private apiUrl: string
  private clientId: string
  private clientSecret: string
  private username: string
  private password: string
  private credentials: DATCredentials | null = null

  constructor() {
    this.apiUrl = DAT_API_URL
    this.clientId = DAT_CLIENT_ID || ''
    this.clientSecret = DAT_CLIENT_SECRET || ''
    this.username = DAT_USERNAME || ''
    this.password = DAT_PASSWORD || ''
  }

  /**
   * Check if DAT is configured
   */
  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret && this.username && this.password)
  }

  /**
   * Check if we have valid credentials
   */
  private hasValidCredentials(): boolean {
    return Boolean(
      this.credentials &&
      this.credentials.accessToken &&
      this.credentials.expiresAt > Date.now()
    )
  }

  /**
   * Authenticate with DAT OAuth2
   */
  async authenticate(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false
    }

    try {
      const response = await fetch(`${this.apiUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'password',
          username: this.username,
          password: this.password,
          scope: 'openid loadboard rateview',
        }).toString(),
      })

      if (!response.ok) {
        console.error('DAT authentication failed:', response.status)
        return false
      }

      const data = await response.json()
      this.credentials = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + (data.expires_in * 1000) - 60000, // 1 min buffer
      }

      return true
    } catch (error) {
      console.error('DAT authentication error:', error)
      return false
    }
  }

  /**
   * Refresh access token
   */
  private async refreshToken(): Promise<boolean> {
    if (!this.credentials?.refreshToken) {
      return this.authenticate()
    }

    try {
      const response = await fetch(`${this.apiUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.credentials.refreshToken,
        }).toString(),
      })

      if (!response.ok) {
        // Refresh failed, try full auth
        return this.authenticate()
      }

      const data = await response.json()
      this.credentials = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || this.credentials.refreshToken,
        expiresAt: Date.now() + (data.expires_in * 1000) - 60000,
      }

      return true
    } catch {
      return this.authenticate()
    }
  }

  /**
   * Ensure we have valid credentials
   */
  private async ensureAuthenticated(): Promise<boolean> {
    if (this.hasValidCredentials()) {
      return true
    }

    if (this.credentials?.refreshToken) {
      return this.refreshToken()
    }

    return this.authenticate()
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: object
  ): Promise<T> {
    if (!await this.ensureAuthenticated()) {
      throw new Error('DAT authentication failed')
    }

    const url = `${this.apiUrl}${endpoint}`
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${this.credentials!.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`DAT API error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  /**
   * Post a load to DAT load board
   */
  async postLoad(loadData: DATLoadPost): Promise<DATLoadPostResponse> {
    if (!this.isConfigured()) {
      return { success: false, error: 'DAT is not configured' }
    }

    try {
      const datLoad = {
        referenceNumber: loadData.referenceNumber,
        origin: {
          city: loadData.origin.city,
          stateProvince: loadData.origin.state,
          postalCode: loadData.origin.zipCode,
          deadheadRadius: loadData.origin.radius || 50,
        },
        destination: {
          city: loadData.destination.city,
          stateProvince: loadData.destination.state,
          postalCode: loadData.destination.zipCode,
          deadheadRadius: loadData.destination.radius || 50,
        },
        earliestAvailability: loadData.pickupDate,
        latestAvailability: loadData.deliveryDate,
        equipmentType: EQUIPMENT_TYPE_MAP[loadData.equipmentType] || loadData.equipmentType,
        lengthFeet: loadData.length,
        weightPounds: loadData.weight,
        rate: loadData.rate
          ? {
              amount: loadData.rate,
              type: loadData.rateType === 'per-mile' ? 'PER_MILE' : 'FLAT',
            }
          : undefined,
        commodity: loadData.commodity,
        comments: loadData.comments,
        contact: {
          name: loadData.contactName,
          phone: loadData.contactPhone,
          email: loadData.contactEmail,
        },
        requirements: {
          teamRequired: loadData.isTeamRequired,
          hazmat: loadData.isHazmat,
        },
        pieces: loadData.pieces,
        loadType: loadData.fullPartial === 'partial' ? 'PARTIAL' : 'FULL',
      }

      const result = await this.request<any>('/loadboard/postings', 'POST', datLoad)

      return {
        success: true,
        postingId: result.postingId || result.id,
        matchingAssetCount: result.matchingAssets,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to post load',
      }
    }
  }

  /**
   * Build load post from our Load entity
   */
  buildLoadPost(
    load: Load,
    pickupLocation?: CustomerLocation | null,
    deliveryLocation?: CustomerLocation | null,
    contactInfo?: { name: string; phone: string; email: string }
  ): DATLoadPost {
    const pickup = pickupLocation || load.pickupAddress
    const delivery = deliveryLocation || load.deliveryAddress

    return {
      referenceNumber: load.loadNumber || load.id,
      origin: {
        city: pickup?.city || '',
        state: pickup?.state || '',
        zipCode: pickup?.zipCode || undefined,
      },
      destination: {
        city: delivery?.city || '',
        state: delivery?.state || '',
        zipCode: delivery?.zipCode || undefined,
      },
      pickupDate: load.pickupDate,
      deliveryDate: load.deliveryDate,
      equipmentType: load.equipmentType,
      weight: load.weight || undefined,
      rate: load.customerRate || undefined,
      commodity: load.commodity || undefined,
      comments: load.specialInstructions || undefined,
      contactName: contactInfo?.name,
      contactPhone: contactInfo?.phone,
      contactEmail: contactInfo?.email,
    }
  }

  /**
   * Update an existing load posting
   */
  async updateLoadPost(postingId: string, loadData: Partial<DATLoadPost>): Promise<DATLoadPostResponse> {
    if (!this.isConfigured()) {
      return { success: false, error: 'DAT is not configured' }
    }

    try {
      await this.request(`/loadboard/postings/${postingId}`, 'PUT', loadData)
      return { success: true, postingId }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update load posting',
      }
    }
  }

  /**
   * Remove a load posting from DAT
   */
  async removeLoadPost(postingId: string): Promise<DATLoadPostResponse> {
    if (!this.isConfigured()) {
      return { success: false, error: 'DAT is not configured' }
    }

    try {
      await this.request(`/loadboard/postings/${postingId}`, 'DELETE')
      return { success: true, postingId }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to remove load posting',
      }
    }
  }

  /**
   * Search for available trucks
   */
  async searchTrucks(search: DATTruckSearch): Promise<DATTruckSearchResponse> {
    if (!this.isConfigured()) {
      return { success: false, error: 'DAT is not configured' }
    }

    try {
      const params = {
        originCity: search.origin.city,
        originState: search.origin.state,
        originRadius: search.origin.radius || 100,
        destCity: search.destination?.city,
        destState: search.destination?.state,
        destRadius: search.destination?.radius || 100,
        equipmentTypes: search.equipmentTypes?.map(t => EQUIPMENT_TYPE_MAP[t] || t).join(','),
        availableDate: search.availableDate,
        maxDeadheadOrigin: search.deadheadOrigin || 150,
        maxDeadheadDestination: search.deadheadDestination || 150,
        limit: search.limit || 50,
      }

      // Remove undefined values
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined)
      )

      const queryString = new URLSearchParams(cleanParams as Record<string, string>).toString()
      const result = await this.request<any>(`/loadboard/trucks/search?${queryString}`)

      const trucks: DATTruck[] = (result.trucks || result.results || []).map((truck: any) => ({
        postingId: truck.postingId || truck.id,
        carrier: {
          name: truck.carrier?.name || truck.companyName,
          mcNumber: truck.carrier?.mcNumber,
          dotNumber: truck.carrier?.dotNumber,
          phone: truck.carrier?.phone || truck.contact?.phone,
          email: truck.carrier?.email || truck.contact?.email,
          rating: truck.carrier?.rating,
          authorityAge: truck.carrier?.authorityMonths,
        },
        equipment: {
          type: truck.equipmentType,
          length: truck.lengthFeet,
        },
        location: {
          city: truck.origin?.city || truck.location?.city,
          state: truck.origin?.stateProvince || truck.location?.state,
          zipCode: truck.origin?.postalCode,
        },
        destination: truck.destination
          ? {
              city: truck.destination.city,
              state: truck.destination.stateProvince,
              preferredLanes: truck.destination.preferredLanes,
            }
          : undefined,
        availableDate: truck.availableDate || truck.earliestAvailability,
        comments: truck.comments,
      }))

      return {
        success: true,
        trucks,
        totalCount: result.totalCount || trucks.length,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to search trucks',
      }
    }
  }

  /**
   * Get market rates for a lane
   */
  async getRates(request: DATRateRequest): Promise<DATRateResponse> {
    if (!this.isConfigured()) {
      return { success: false, error: 'DAT is not configured' }
    }

    try {
      const params = {
        originCity: request.origin.city,
        originState: request.origin.state,
        destCity: request.destination.city,
        destState: request.destination.state,
        equipmentType: EQUIPMENT_TYPE_MAP[request.equipmentType] || request.equipmentType,
        date: request.date,
      }

      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined)
      )

      const queryString = new URLSearchParams(cleanParams as Record<string, string>).toString()
      const result = await this.request<any>(`/rateview/rates?${queryString}`)

      return {
        success: true,
        rates: {
          spotRate: {
            low: result.spot?.low || result.spotLow,
            average: result.spot?.average || result.spotAverage,
            high: result.spot?.high || result.spotHigh,
            perMile: result.spot?.perMile || result.spotPerMile,
            totalMiles: result.mileage || result.totalMiles,
            sampleSize: result.spot?.sampleSize,
          },
          contractRate: result.contract
            ? {
                low: result.contract.low,
                average: result.contract.average,
                high: result.contract.high,
                perMile: result.contract.perMile,
              }
            : undefined,
          fuelSurcharge: result.fuelSurcharge,
          trend: result.trend
            ? {
                direction: result.trend.direction,
                percentChange: result.trend.percentChange,
                period: result.trend.period || '7d',
              }
            : undefined,
        },
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get rates',
      }
    }
  }

  /**
   * Get rate history for a lane
   */
  async getLaneHistory(
    origin: { city: string; state: string },
    destination: { city: string; state: string },
    equipmentType: string,
    days: number = 90
  ): Promise<DATLaneHistory | null> {
    if (!this.isConfigured()) {
      return null
    }

    try {
      const params = {
        originCity: origin.city,
        originState: origin.state,
        destCity: destination.city,
        destState: destination.state,
        equipmentType: EQUIPMENT_TYPE_MAP[equipmentType] || equipmentType,
        days: days.toString(),
      }

      const queryString = new URLSearchParams(params).toString()
      const result = await this.request<any>(`/rateview/history?${queryString}`)

      return {
        lane: { origin, destination },
        equipmentType,
        history: (result.history || result.data || []).map((h: any) => ({
          date: h.date,
          spotRate: h.spotRate || h.spot,
          contractRate: h.contractRate || h.contract,
          volume: h.volume || h.loadCount,
          fuelPrice: h.fuelPrice,
        })),
      }
    } catch {
      return null
    }
  }

  /**
   * Get my active load postings
   */
  async getMyPostings(): Promise<DATLoadPost[]> {
    if (!this.isConfigured()) {
      return []
    }

    try {
      const result = await this.request<any>('/loadboard/postings/mine')
      return (result.postings || result.data || []).map((posting: any) => ({
        postingId: posting.postingId || posting.id,
        referenceNumber: posting.referenceNumber,
        origin: {
          city: posting.origin?.city,
          state: posting.origin?.stateProvince,
          zipCode: posting.origin?.postalCode,
        },
        destination: {
          city: posting.destination?.city,
          state: posting.destination?.stateProvince,
          zipCode: posting.destination?.postalCode,
        },
        pickupDate: posting.earliestAvailability,
        deliveryDate: posting.latestAvailability,
        equipmentType: posting.equipmentType,
        rate: posting.rate?.amount,
        rateType: posting.rate?.type === 'PER_MILE' ? 'per-mile' : 'flat',
      }))
    } catch {
      return []
    }
  }

  /**
   * Calculate suggested rate based on market data
   */
  async getSuggestedRate(
    origin: { city: string; state: string },
    destination: { city: string; state: string },
    equipmentType: string,
    targetMargin?: number // as decimal, e.g., 0.15 for 15%
  ): Promise<{
    suggestedCustomerRate: number
    suggestedCarrierRate: number
    marketRate: number
    margin: number
    mileage: number
  } | null> {
    const rates = await this.getRates({
      origin,
      destination,
      equipmentType,
    })

    if (!rates.success || !rates.rates) {
      return null
    }

    const spotAvg = rates.rates.spotRate.average
    const mileage = rates.rates.spotRate.totalMiles
    const margin = targetMargin || 0.15

    // Carrier rate should be around spot average
    const suggestedCarrierRate = Math.round(spotAvg)
    // Customer rate adds margin on top
    const suggestedCustomerRate = Math.round(suggestedCarrierRate / (1 - margin))

    return {
      suggestedCustomerRate,
      suggestedCarrierRate,
      marketRate: spotAvg,
      margin,
      mileage,
    }
  }
}

// Export singleton instance
export const dat = new DATService()

// Export class for testing
export { DATService }
