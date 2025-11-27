/**
 * MacroPoint Integration Service
 *
 * Integrates with Descartes MacroPoint for real-time freight tracking.
 * API Base: https://macropoint-lite.com/api/1.0/
 *
 * Environment Variables Required:
 * - MACROPOINT_API_ID: Your MacroPoint API ID
 * - MACROPOINT_API_PASSWORD: Your MacroPoint API Password
 * - MACROPOINT_WEBHOOK_URL: Your webhook URL for receiving updates
 */

import type { Load, Carrier, CustomerLocation } from '@/payload-types'

const MACROPOINT_BASE_URL = process.env.MACROPOINT_BASE_URL || 'https://macropoint-lite.com/api/1.0'
const MACROPOINT_API_ID = process.env.MACROPOINT_API_ID
const MACROPOINT_API_PASSWORD = process.env.MACROPOINT_API_PASSWORD
const MACROPOINT_WEBHOOK_URL = process.env.MACROPOINT_WEBHOOK_URL

export interface MacroPointOrder {
  orderId: string
  referenceNumber: string
  carrier: {
    mcNumber: string
    dotNumber?: string
    name: string
    phone?: string
    email?: string
  }
  origin: {
    name?: string
    address: string
    city: string
    state: string
    zip: string
    appointmentStart?: string
    appointmentEnd?: string
  }
  destination: {
    name?: string
    address: string
    city: string
    state: string
    zip: string
    appointmentStart?: string
    appointmentEnd?: string
  }
  equipment?: string
  commodity?: string
  weight?: number
  driverPhone?: string
  callbackUrl?: string
}

export interface MacroPointTrackingResponse {
  success: boolean
  orderId?: string
  trackingId?: string
  status?: string
  error?: string
  message?: string
}

export interface MacroPointLocationUpdate {
  orderId: string
  eventCode: string // X1=pickup, X2=delivery, X3=arrived pickup, X4=arrived delivery, etc.
  eventTime: string
  latitude?: number
  longitude?: number
  city?: string
  state?: string
  address?: string
  eta?: {
    arrival: string
    milesRemaining: number
    minutesRemaining: number
  }
  driver?: {
    name?: string
    phone?: string
  }
}

// Event code mapping
export const MACROPOINT_EVENT_CODES = {
  X1: 'departed-pickup',
  X2: 'departed-delivery',
  X3: 'arrived-pickup',
  X4: 'arrived-delivery',
  LOCATION: 'location',
  DELAY: 'delay',
  EXCEPTION: 'exception',
} as const

class MacroPointService {
  private apiId: string
  private apiPassword: string
  private baseUrl: string
  private webhookUrl: string

  constructor() {
    this.apiId = MACROPOINT_API_ID || ''
    this.apiPassword = MACROPOINT_API_PASSWORD || ''
    this.baseUrl = MACROPOINT_BASE_URL
    this.webhookUrl = MACROPOINT_WEBHOOK_URL || ''
  }

  /**
   * Check if MacroPoint is configured
   */
  isConfigured(): boolean {
    return Boolean(this.apiId && this.apiPassword)
  }

  /**
   * Get authorization header for API calls
   */
  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.apiId}:${this.apiPassword}`).toString('base64')
    return `Basic ${credentials}`
  }

  /**
   * Make API request to MacroPoint
   */
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: object
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`MacroPoint API error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  /**
   * Create a tracking order/request with MacroPoint
   */
  async createTrackingRequest(
    load: Load,
    carrier: Carrier,
    pickupLocation?: CustomerLocation | null,
    deliveryLocation?: CustomerLocation | null
  ): Promise<MacroPointTrackingResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'MacroPoint is not configured. Please set MACROPOINT_API_ID and MACROPOINT_API_PASSWORD.',
      }
    }

    // Build origin address
    const pickup = pickupLocation || load.pickupAddress
    const origin = {
      name: pickupLocation?.locationName || load.pickupAddress?.facilityName || '',
      address: (pickupLocation?.addressLine1 || load.pickupAddress?.addressLine1) ?? '',
      city: (pickupLocation?.city || load.pickupAddress?.city) ?? '',
      state: (pickupLocation?.state || load.pickupAddress?.state) ?? '',
      zip: (pickupLocation?.zipCode || load.pickupAddress?.zipCode) ?? '',
      appointmentStart: load.pickupDate,
      appointmentEnd: load.pickupDateEnd || undefined,
    }

    // Build destination address
    const delivery = deliveryLocation || load.deliveryAddress
    const destination = {
      name: deliveryLocation?.locationName || load.deliveryAddress?.facilityName || '',
      address: (deliveryLocation?.addressLine1 || load.deliveryAddress?.addressLine1) ?? '',
      city: (deliveryLocation?.city || load.deliveryAddress?.city) ?? '',
      state: (deliveryLocation?.state || load.deliveryAddress?.state) ?? '',
      zip: (deliveryLocation?.zipCode || load.deliveryAddress?.zipCode) ?? '',
      appointmentStart: load.deliveryDate,
      appointmentEnd: load.deliveryDateEnd || undefined,
    }

    const order: MacroPointOrder = {
      orderId: load.id,
      referenceNumber: load.loadNumber || load.id,
      carrier: {
        mcNumber: carrier.mcNumber,
        dotNumber: carrier.dotNumber,
        name: carrier.companyName,
        phone: carrier.phone || undefined,
        email: carrier.dispatchEmail || carrier.email || undefined,
      },
      origin,
      destination,
      equipment: load.equipmentType,
      commodity: load.commodity || undefined,
      weight: load.weight || undefined,
      driverPhone: load.driverInfo?.driverPhone || undefined,
      callbackUrl: this.webhookUrl,
    }

    try {
      const response = await this.request<MacroPointTrackingResponse>(
        '/orders',
        'POST',
        order
      )

      return {
        success: true,
        orderId: response.orderId || load.id,
        trackingId: response.trackingId,
        status: response.status,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Update tracking request with driver information
   */
  async updateDriverInfo(
    orderId: string,
    driverPhone: string,
    driverName?: string
  ): Promise<MacroPointTrackingResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'MacroPoint is not configured',
      }
    }

    try {
      const response = await this.request<MacroPointTrackingResponse>(
        `/orders/${orderId}/driver`,
        'PUT',
        {
          phone: driverPhone,
          name: driverName,
        }
      )

      return {
        ...response,
        success: true,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Cancel a tracking request
   */
  async cancelTracking(orderId: string): Promise<MacroPointTrackingResponse> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'MacroPoint is not configured',
      }
    }

    try {
      await this.request(`/orders/${orderId}`, 'DELETE')
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get current tracking status
   */
  async getTrackingStatus(orderId: string): Promise<MacroPointTrackingResponse & { location?: MacroPointLocationUpdate }> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'MacroPoint is not configured',
      }
    }

    try {
      const response = await this.request<any>(`/orders/${orderId}`)
      return {
        success: true,
        status: response.status,
        location: response.lastLocation,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Parse incoming webhook payload from MacroPoint
   */
  parseWebhookPayload(payload: any): MacroPointLocationUpdate | null {
    try {
      return {
        orderId: payload.orderId || payload.order_id,
        eventCode: payload.eventCode || payload.event_code || 'LOCATION',
        eventTime: payload.eventTime || payload.event_time || new Date().toISOString(),
        latitude: payload.latitude || payload.lat,
        longitude: payload.longitude || payload.lng || payload.lon,
        city: payload.city,
        state: payload.state,
        address: payload.address,
        eta: payload.eta ? {
          arrival: payload.eta.arrival || payload.eta.estimatedArrival,
          milesRemaining: payload.eta.milesRemaining || payload.eta.miles_remaining,
          minutesRemaining: payload.eta.minutesRemaining || payload.eta.minutes_remaining,
        } : undefined,
        driver: payload.driver ? {
          name: payload.driver.name,
          phone: payload.driver.phone,
        } : undefined,
      }
    } catch {
      return null
    }
  }

  /**
   * Map MacroPoint event code to our internal event type
   */
  mapEventCodeToType(eventCode: string): string {
    const mapping: Record<string, string> = {
      X1: 'departed-pickup',
      X2: 'departed-delivery',
      X3: 'arrived-pickup',
      X4: 'arrived-delivery',
      LOCATION: 'location',
      LOC: 'location',
      DELAY: 'delay',
      EXCEPTION: 'exception',
      EXC: 'exception',
    }

    return mapping[eventCode.toUpperCase()] || 'location'
  }

  /**
   * Determine if event should trigger load status update
   */
  shouldUpdateLoadStatus(eventCode: string): { update: boolean; newStatus?: string } {
    switch (eventCode.toUpperCase()) {
      case 'X1': // Departed pickup
        return { update: true, newStatus: 'in-transit' }
      case 'X3': // Arrived at pickup
        return { update: false } // Stay dispatched, just log event
      case 'X4': // Arrived at delivery
        return { update: true, newStatus: 'delivered' }
      default:
        return { update: false }
    }
  }
}

// Export singleton instance
export const macropoint = new MacroPointService()

// Export class for testing
export { MacroPointService }
