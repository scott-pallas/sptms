'use client'

import { useQuery } from '@tanstack/react-query'
import { fetchDashboardStats, fetchLoads } from '@/lib/api-client'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 60000, // Refresh every minute
  })
}

export function useRecentLoads(limit = 5) {
  return useQuery({
    queryKey: ['loads', 'recent', limit],
    queryFn: () => fetchLoads({ limit, sort: '-createdAt' }),
  })
}
