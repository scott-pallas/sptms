/**
 * ePay Carrier Payment Integration Service
 *
 * Integrates with ePay for carrier payments.
 * ePay is a freight payment solution that handles carrier payments,
 * factoring, and quick pay services.
 *
 * Environment Variables Required:
 * - EPAY_API_URL: ePay API endpoint
 * - EPAY_MEMBER_ID: Your broker member ID from ePay
 * - EPAY_API_KEY: API key for authentication
 * - EPAY_API_SECRET: API secret for authentication
 */

import type { Carrier, Load } from '@/payload-types'

const EPAY_API_URL = process.env.EPAY_API_URL || 'https://api.epay.com/v1'
const EPAY_MEMBER_ID = process.env.EPAY_MEMBER_ID
const EPAY_API_KEY = process.env.EPAY_API_KEY
const EPAY_API_SECRET = process.env.EPAY_API_SECRET

export interface EPayCarrier {
  carrierId: string
  mcNumber: string
  dotNumber?: string
  companyName: string
  paymentMethod: 'ach' | 'check' | 'factoring'
  factoringCompany?: string
  status: 'active' | 'inactive' | 'pending'
}

export interface EPayPaymentRequest {
  brokerId: string
  carrierId: string
  referenceNumber: string
  loadNumber: string
  amount: number
  paymentType: 'standard' | 'quick-pay'
  quickPayFee?: number
  lineItems: Array<{
    description: string
    amount: number
    type: 'linehaul' | 'detention' | 'layover' | 'lumper' | 'other'
  }>
  deductions?: Array<{
    description: string
    amount: number
    type: string
  }>
  origin: {
    city: string
    state: string
  }
  destination: {
    city: string
    state: string
  }
  deliveryDate: string
  notes?: string
}

export interface EPayPaymentResponse {
  success: boolean
  transactionId?: string
  status?: 'pending' | 'processing' | 'approved' | 'paid' | 'rejected'
  estimatedPayDate?: string
  error?: string
  message?: string
}

export interface EPaySyncResult {
  success: boolean
  carrierId?: string
  error?: string
}

class EPayService {
  private apiUrl: string
  private memberId: string
  private apiKey: string
  private apiSecret: string

  constructor() {
    this.apiUrl = EPAY_API_URL
    this.memberId = EPAY_MEMBER_ID || ''
    this.apiKey = EPAY_API_KEY || ''
    this.apiSecret = EPAY_API_SECRET || ''
  }

  /**
   * Check if ePay is configured
   */
  isConfigured(): boolean {
    return Boolean(this.memberId && this.apiKey && this.apiSecret)
  }

  /**
   * Generate authentication headers
   */
  private getAuthHeaders(): Record<string, string> {
    const timestamp = Date.now().toString()
    // In production, this would be a proper HMAC signature
    const signature = Buffer.from(`${this.apiKey}:${this.apiSecret}:${timestamp}`).toString('base64')

    return {
      'Content-Type': 'application/json',
      'X-Api-Key': this.apiKey,
      'X-Member-Id': this.memberId,
      'X-Timestamp': timestamp,
      'X-Signature': signature,
    }
  }

  /**
   * Make API request to ePay
   */
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: object
  ): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`

    const response = await fetch(url, {
      method,
      headers: this.getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`ePay API error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  /**
   * Sync carrier to ePay
   */
  async syncCarrier(carrier: Carrier): Promise<EPaySyncResult> {
    if (!this.isConfigured()) {
      return { success: false, error: 'ePay is not configured' }
    }

    try {
      const epayCarrier = {
        mcNumber: carrier.mcNumber,
        dotNumber: carrier.dotNumber,
        companyName: carrier.companyName,
        contactName: carrier.primaryContact,
        email: carrier.email,
        phone: carrier.phone,
        paymentMethod: carrier.paymentMethod === 'factoring' ? 'factoring' :
                       carrier.paymentMethod === 'quick-pay' ? 'ach' : 'ach',
        factoringCompany: carrier.factoringCompany,
      }

      const result = await this.request<{ carrierId: string }>(
        '/carriers',
        'POST',
        epayCarrier
      )

      return {
        success: true,
        carrierId: result.carrierId,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to sync carrier',
      }
    }
  }

  /**
   * Get carrier from ePay by MC number
   */
  async getCarrierByMC(mcNumber: string): Promise<EPayCarrier | null> {
    if (!this.isConfigured()) {
      return null
    }

    try {
      return await this.request<EPayCarrier>(`/carriers/mc/${mcNumber}`)
    } catch {
      return null
    }
  }

  /**
   * Submit payment request to ePay
   */
  async submitPayment(
    paymentData: EPayPaymentRequest
  ): Promise<EPayPaymentResponse> {
    if (!this.isConfigured()) {
      return { success: false, error: 'ePay is not configured' }
    }

    try {
      const result = await this.request<EPayPaymentResponse>(
        '/payments',
        'POST',
        paymentData
      )

      return {
        ...result,
        success: true,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to submit payment',
      }
    }
  }

  /**
   * Create payment request from carrier payment record
   */
  buildPaymentRequest(
    carrier: Carrier,
    loads: Load[],
    paySheetNumber: string,
    lineItems: Array<{ description: string; amount: number; type: string }>,
    deductions: Array<{ description: string; amount: number; type: string }>,
    paymentType: 'standard' | 'quick-pay',
    quickPayFee?: number
  ): EPayPaymentRequest {
    // Get first load for origin/destination
    const firstLoad = loads[0]
    const lastLoad = loads[loads.length - 1]

    return {
      brokerId: this.memberId,
      carrierId: carrier.ePayCarrierId || '',
      referenceNumber: paySheetNumber,
      loadNumber: loads.map(l => l.loadNumber).join(', '),
      amount: lineItems.reduce((sum, item) => sum + item.amount, 0) -
              deductions.reduce((sum, d) => sum + d.amount, 0),
      paymentType,
      quickPayFee: paymentType === 'quick-pay' ? quickPayFee : undefined,
      lineItems: lineItems.map(item => ({
        description: item.description,
        amount: item.amount,
        type: item.type as 'linehaul' | 'detention' | 'layover' | 'lumper' | 'other',
      })),
      deductions: deductions.map(d => ({
        description: d.description,
        amount: d.amount,
        type: d.type,
      })),
      origin: {
        city: firstLoad.pickupAddress?.city || '',
        state: firstLoad.pickupAddress?.state || '',
      },
      destination: {
        city: lastLoad.deliveryAddress?.city || '',
        state: lastLoad.deliveryAddress?.state || '',
      },
      deliveryDate: lastLoad.deliveryDate,
    }
  }

  /**
   * Get payment status from ePay
   */
  async getPaymentStatus(transactionId: string): Promise<EPayPaymentResponse> {
    if (!this.isConfigured()) {
      return { success: false, error: 'ePay is not configured' }
    }

    try {
      const result = await this.request<EPayPaymentResponse>(
        `/payments/${transactionId}`
      )

      return {
        ...result,
        success: true,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get payment status',
      }
    }
  }

  /**
   * Cancel/void a payment
   */
  async cancelPayment(transactionId: string, reason: string): Promise<EPayPaymentResponse> {
    if (!this.isConfigured()) {
      return { success: false, error: 'ePay is not configured' }
    }

    try {
      await this.request(
        `/payments/${transactionId}/cancel`,
        'POST',
        { reason }
      )

      return {
        success: true,
        transactionId,
        status: 'rejected',
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to cancel payment',
      }
    }
  }

  /**
   * Get pending payments for a carrier
   */
  async getCarrierPendingPayments(carrierId: string): Promise<EPayPaymentResponse[]> {
    if (!this.isConfigured()) {
      return []
    }

    try {
      const result = await this.request<{ payments: EPayPaymentResponse[] }>(
        `/carriers/${carrierId}/payments?status=pending`
      )

      return result.payments || []
    } catch {
      return []
    }
  }

  /**
   * Process webhook from ePay
   */
  parseWebhook(payload: any): {
    type: 'payment_update' | 'carrier_update' | 'unknown'
    transactionId?: string
    carrierId?: string
    status?: string
    data: any
  } {
    // Parse based on ePay webhook format
    if (payload.event === 'payment.updated' || payload.event === 'payment.status_changed') {
      return {
        type: 'payment_update',
        transactionId: payload.transactionId || payload.data?.transactionId,
        status: payload.status || payload.data?.status,
        data: payload,
      }
    }

    if (payload.event === 'carrier.updated') {
      return {
        type: 'carrier_update',
        carrierId: payload.carrierId || payload.data?.carrierId,
        data: payload,
      }
    }

    return {
      type: 'unknown',
      data: payload,
    }
  }
}

// Export singleton instance
export const epay = new EPayService()

// Export class for testing
export { EPayService }
