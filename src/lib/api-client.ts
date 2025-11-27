/**
 * API Client for frontend to communicate with Payload CMS
 */

const API_BASE = '/api'

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
}

async function fetchAPI<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options

  let url = `${API_BASE}${endpoint}`

  // Add query params
  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += `?${queryString}`
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }))
    throw new Error(error.message || `HTTP error ${response.status}`)
  }

  return response.json()
}

// Loads API
export interface LoadFilters {
  status?: string
  customer?: string
  carrier?: string
  limit?: number
  page?: number
  sort?: string
}

export async function fetchLoads(filters?: LoadFilters) {
  const params: Record<string, string | number | undefined> = {
    limit: filters?.limit || 10,
    page: filters?.page || 1,
    sort: filters?.sort || '-createdAt',
    depth: 1,
  }

  if (filters?.status) {
    params['where[status][equals]'] = filters.status
  }
  if (filters?.customer) {
    params['where[customer][equals]'] = filters.customer
  }

  return fetchAPI<{ docs: any[]; totalDocs: number; page: number; totalPages: number }>(
    '/loads',
    { params }
  )
}

export async function fetchLoad(id: string) {
  return fetchAPI<any>(`/loads/${id}`, { params: { depth: 2 } })
}

export async function updateLoadStatus(id: string, status: string) {
  return fetchAPI<any>(`/loads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

// Dashboard Stats
export async function fetchDashboardStats() {
  // Fetch multiple endpoints in parallel
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString()

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthStartISO = monthStart.toISOString()

  const [
    allLoads,
    todayLoads,
    inTransitLoads,
    deliveredToday,
    openInvoices,
  ] = await Promise.all([
    // All loads this month for revenue calculation
    fetchAPI<{ docs: any[] }>('/loads', {
      params: {
        limit: 1000,
        [`where[createdAt][greater_than]`]: monthStartISO,
        depth: 0,
      },
    }),
    // Loads created today
    fetchAPI<{ totalDocs: number }>('/loads', {
      params: {
        limit: 1,
        [`where[createdAt][greater_than]`]: todayISO,
      },
    }),
    // In transit
    fetchAPI<{ totalDocs: number }>('/loads', {
      params: {
        limit: 1,
        [`where[status][equals]`]: 'in-transit',
      },
    }),
    // Delivered today
    fetchAPI<{ totalDocs: number }>('/loads', {
      params: {
        limit: 1,
        [`where[status][equals]`]: 'delivered',
        [`where[updatedAt][greater_than]`]: todayISO,
      },
    }),
    // Open invoices
    fetchAPI<{ totalDocs: number }>('/invoices', {
      params: {
        limit: 1,
        [`where[status][in]`]: 'sent,overdue',
      },
    }).catch(() => ({ totalDocs: 0 })),
  ])

  // Calculate revenue and margin
  const revenue = allLoads.docs.reduce((sum, load) => sum + (load.customerRate || 0), 0)
  const cost = allLoads.docs.reduce((sum, load) => sum + (load.carrierRate || 0), 0)
  const margin = revenue > 0 ? Math.round(((revenue - cost) / revenue) * 100) : 0

  // Count pending deliveries for today
  const pendingDeliveries = await fetchAPI<{ totalDocs: number }>('/loads', {
    params: {
      limit: 1,
      [`where[status][in]`]: 'dispatched,in-transit',
      [`where[deliveryDate][greater_than]`]: todayISO,
      [`where[deliveryDate][less_than]`]: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    },
  }).catch(() => ({ totalDocs: 0 }))

  return {
    loadsToday: todayLoads.totalDocs,
    loadsInTransit: inTransitLoads.totalDocs,
    revenueMonth: revenue,
    marginPercent: margin,
    openInvoices: openInvoices.totalDocs,
    pendingDeliveries: pendingDeliveries.totalDocs,
    alertCount: 0, // TODO: Implement alerts
    completedToday: deliveredToday.totalDocs,
  }
}

// Carriers API
export async function fetchCarriers(filters?: { limit?: number; status?: string }) {
  const params: Record<string, string | number | undefined> = {
    limit: filters?.limit || 10,
    sort: 'companyName',
  }

  if (filters?.status) {
    params['where[status][equals]'] = filters.status
  }

  return fetchAPI<{ docs: any[]; totalDocs: number }>('/carriers', { params })
}

// Customers API
export async function fetchCustomers(filters?: { limit?: number; status?: string }) {
  const params: Record<string, string | number | undefined> = {
    limit: filters?.limit || 10,
    sort: 'companyName',
  }

  if (filters?.status) {
    params['where[status][equals]'] = filters.status
  }

  return fetchAPI<{ docs: any[]; totalDocs: number }>('/customers', { params })
}

// DAT Rates API
export async function fetchDATRates(params: {
  originCity: string
  originState: string
  destCity: string
  destState: string
  equipmentType: string
  targetMargin?: number
}) {
  return fetchAPI<any>('/dat/rates', {
    params: {
      originCity: params.originCity,
      originState: params.originState,
      destCity: params.destCity,
      destState: params.destState,
      equipmentType: params.equipmentType,
      targetMargin: params.targetMargin,
    },
  })
}

// DAT Truck Search
export async function searchTrucks(params: {
  originCity: string
  originState: string
  destCity?: string
  destState?: string
  equipmentTypes?: string
  limit?: number
}) {
  return fetchAPI<any>('/dat/trucks', { params })
}
