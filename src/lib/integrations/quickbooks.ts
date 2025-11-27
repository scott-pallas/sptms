/**
 * QuickBooks Online Integration Service
 *
 * Integrates with QuickBooks Online for:
 * - Customer sync
 * - Invoice creation and sync
 * - Payment tracking
 *
 * Environment Variables Required:
 * - QUICKBOOKS_CLIENT_ID: OAuth2 Client ID
 * - QUICKBOOKS_CLIENT_SECRET: OAuth2 Client Secret
 * - QUICKBOOKS_REDIRECT_URI: OAuth2 Redirect URI
 * - QUICKBOOKS_ENVIRONMENT: 'sandbox' or 'production'
 * - QUICKBOOKS_REALM_ID: Company ID (obtained after OAuth)
 * - QUICKBOOKS_ACCESS_TOKEN: Access token (stored/refreshed)
 * - QUICKBOOKS_REFRESH_TOKEN: Refresh token (stored/refreshed)
 */

// @ts-ignore - node-quickbooks doesn't have type definitions
import QuickBooks from 'node-quickbooks'
import type { Customer } from '@/payload-types'

const QB_CLIENT_ID = process.env.QUICKBOOKS_CLIENT_ID
const QB_CLIENT_SECRET = process.env.QUICKBOOKS_CLIENT_SECRET
const QB_REDIRECT_URI = process.env.QUICKBOOKS_REDIRECT_URI
const QB_ENVIRONMENT = process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox'
const QB_REALM_ID = process.env.QUICKBOOKS_REALM_ID
const QB_ACCESS_TOKEN = process.env.QUICKBOOKS_ACCESS_TOKEN
const QB_REFRESH_TOKEN = process.env.QUICKBOOKS_REFRESH_TOKEN

export interface QBCustomer {
  Id?: string
  SyncToken?: string
  DisplayName: string
  CompanyName?: string
  PrimaryEmailAddr?: { Address: string }
  PrimaryPhone?: { FreeFormNumber: string }
  BillAddr?: {
    Line1?: string
    City?: string
    CountrySubDivisionCode?: string
    PostalCode?: string
  }
  Balance?: number
}

export interface QBInvoice {
  Id?: string
  SyncToken?: string
  DocNumber?: string
  TxnDate: string
  DueDate?: string
  CustomerRef: { value: string; name?: string }
  Line: Array<{
    Amount: number
    Description?: string
    DetailType: 'SalesItemLineDetail' | 'SubTotalLineDetail'
    SalesItemLineDetail?: {
      ItemRef?: { value: string; name?: string }
      Qty?: number
      UnitPrice?: number
    }
  }>
  TotalAmt?: number
  Balance?: number
  EmailStatus?: string
  BillEmail?: { Address: string }
  PrivateNote?: string
}

export interface QBSyncResult {
  success: boolean
  qbId?: string
  syncToken?: string
  error?: string
}

class QuickBooksService {
  private qbo: any | null = null

  constructor() {
    this.initializeClient()
  }

  /**
   * Initialize QuickBooks client
   */
  private initializeClient(): void {
    if (!this.isConfigured()) {
      return
    }

    this.qbo = new QuickBooks(
      QB_CLIENT_ID,
      QB_CLIENT_SECRET,
      QB_ACCESS_TOKEN,
      false, // no token secret for OAuth2
      QB_REALM_ID,
      QB_ENVIRONMENT === 'sandbox', // use sandbox
      true, // enable debugging
      null, // minor version
      '2.0', // OAuth version
      QB_REFRESH_TOKEN
    )
  }

  /**
   * Check if QuickBooks is configured
   */
  isConfigured(): boolean {
    return Boolean(
      QB_CLIENT_ID &&
      QB_CLIENT_SECRET &&
      QB_REALM_ID &&
      QB_ACCESS_TOKEN
    )
  }

  /**
   * Get OAuth2 authorization URL
   */
  getAuthorizationUrl(): string {
    const scopes = 'com.intuit.quickbooks.accounting'
    const state = Math.random().toString(36).substring(7)

    return `https://appcenter.intuit.com/connect/oauth2?client_id=${QB_CLIENT_ID}&response_type=code&scope=${scopes}&redirect_uri=${encodeURIComponent(QB_REDIRECT_URI || '')}&state=${state}`
  }

  /**
   * Helper to promisify QuickBooks callbacks
   */
  private promisify<T>(method: Function, ...args: any[]): Promise<T> {
    return new Promise((resolve, reject) => {
      method.call(this.qbo, ...args, (err: any, result: T) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  }

  /**
   * Create or update a customer in QuickBooks
   */
  async syncCustomer(customer: Customer, existingQbId?: string): Promise<QBSyncResult> {
    if (!this.isConfigured() || !this.qbo) {
      return { success: false, error: 'QuickBooks is not configured' }
    }

    const qbCustomer: QBCustomer = {
      DisplayName: customer.companyName,
      CompanyName: customer.companyName,
      PrimaryEmailAddr: customer.email ? { Address: customer.email } : undefined,
      PrimaryPhone: customer.phone ? { FreeFormNumber: customer.phone } : undefined,
    }

    try {
      if (existingQbId) {
        // Get current customer to get SyncToken
        const current = await this.promisify<QBCustomer>(
          this.qbo.getCustomer,
          existingQbId
        )

        qbCustomer.Id = existingQbId
        qbCustomer.SyncToken = current.SyncToken

        const updated = await this.promisify<QBCustomer>(
          this.qbo.updateCustomer,
          qbCustomer
        )

        return {
          success: true,
          qbId: updated.Id,
          syncToken: updated.SyncToken,
        }
      } else {
        // Create new customer
        const created = await this.promisify<QBCustomer>(
          this.qbo.createCustomer,
          qbCustomer
        )

        return {
          success: true,
          qbId: created.Id,
          syncToken: created.SyncToken,
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to sync customer',
      }
    }
  }

  /**
   * Find customer by name in QuickBooks
   */
  async findCustomerByName(name: string): Promise<QBCustomer | null> {
    if (!this.isConfigured() || !this.qbo) {
      return null
    }

    try {
      const result = await this.promisify<{ QueryResponse: { Customer?: QBCustomer[] } }>(
        this.qbo.findCustomers,
        { DisplayName: name }
      )

      if (result.QueryResponse?.Customer?.length) {
        return result.QueryResponse.Customer[0]
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * Create invoice in QuickBooks
   */
  async createInvoice(
    invoice: {
      invoiceNumber: string
      invoiceDate: string
      dueDate?: string
      customerQbId: string
      customerName: string
      lineItems: Array<{
        description: string
        amount: number
        quantity?: number
      }>
      memo?: string
      email?: string
    }
  ): Promise<QBSyncResult> {
    if (!this.isConfigured() || !this.qbo) {
      return { success: false, error: 'QuickBooks is not configured' }
    }

    const qbInvoice: QBInvoice = {
      DocNumber: invoice.invoiceNumber,
      TxnDate: invoice.invoiceDate.split('T')[0], // YYYY-MM-DD format
      DueDate: invoice.dueDate?.split('T')[0],
      CustomerRef: {
        value: invoice.customerQbId,
        name: invoice.customerName,
      },
      Line: invoice.lineItems.map(item => ({
        Amount: item.amount,
        Description: item.description,
        DetailType: 'SalesItemLineDetail' as const,
        SalesItemLineDetail: {
          Qty: item.quantity || 1,
          UnitPrice: item.amount / (item.quantity || 1),
        },
      })),
      PrivateNote: invoice.memo,
      BillEmail: invoice.email ? { Address: invoice.email } : undefined,
    }

    try {
      const created = await this.promisify<QBInvoice>(
        this.qbo.createInvoice,
        qbInvoice
      )

      return {
        success: true,
        qbId: created.Id,
        syncToken: created.SyncToken,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create invoice',
      }
    }
  }

  /**
   * Get invoice from QuickBooks
   */
  async getInvoice(qbId: string): Promise<QBInvoice | null> {
    if (!this.isConfigured() || !this.qbo) {
      return null
    }

    try {
      return await this.promisify<QBInvoice>(this.qbo.getInvoice, qbId)
    } catch {
      return null
    }
  }

  /**
   * Void invoice in QuickBooks
   */
  async voidInvoice(qbId: string): Promise<QBSyncResult> {
    if (!this.isConfigured() || !this.qbo) {
      return { success: false, error: 'QuickBooks is not configured' }
    }

    try {
      const invoice = await this.getInvoice(qbId)
      if (!invoice) {
        return { success: false, error: 'Invoice not found' }
      }

      await this.promisify<void>(this.qbo.voidInvoice, {
        Id: qbId,
        SyncToken: invoice.SyncToken,
      })

      return { success: true, qbId }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to void invoice',
      }
    }
  }

  /**
   * Get accounts receivable report / customer balances
   */
  async getCustomerBalances(): Promise<Array<{ customerId: string; balance: number }>> {
    if (!this.isConfigured() || !this.qbo) {
      return []
    }

    try {
      const result = await this.promisify<{ QueryResponse: { Customer?: QBCustomer[] } }>(
        this.qbo.findCustomers,
        { fetchAll: true }
      )

      return (result.QueryResponse?.Customer || [])
        .filter(c => c.Balance && c.Balance > 0)
        .map(c => ({
          customerId: c.Id!,
          balance: c.Balance!,
        }))
    } catch {
      return []
    }
  }

  /**
   * Record payment against invoice
   */
  async recordPayment(
    invoiceQbId: string,
    amount: number,
    paymentDate: string,
    paymentMethod?: string
  ): Promise<QBSyncResult> {
    if (!this.isConfigured() || !this.qbo) {
      return { success: false, error: 'QuickBooks is not configured' }
    }

    try {
      const invoice = await this.getInvoice(invoiceQbId)
      if (!invoice) {
        return { success: false, error: 'Invoice not found' }
      }

      const payment = {
        TotalAmt: amount,
        TxnDate: paymentDate.split('T')[0],
        CustomerRef: invoice.CustomerRef,
        Line: [
          {
            Amount: amount,
            LinkedTxn: [
              {
                TxnId: invoiceQbId,
                TxnType: 'Invoice',
              },
            ],
          },
        ],
      }

      const created = await this.promisify<any>(this.qbo.createPayment, payment)

      return {
        success: true,
        qbId: created.Id,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to record payment',
      }
    }
  }
}

// Export singleton instance
export const quickbooks = new QuickBooksService()

// Export class for testing
export { QuickBooksService }
