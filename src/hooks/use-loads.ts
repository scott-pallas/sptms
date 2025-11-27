'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchLoads, fetchLoad, updateLoadStatus, type LoadFilters } from '@/lib/api-client'

export function useLoads(filters?: LoadFilters) {
  return useQuery({
    queryKey: ['loads', filters],
    queryFn: () => fetchLoads(filters),
  })
}

export function useLoad(id: string) {
  return useQuery({
    queryKey: ['loads', id],
    queryFn: () => fetchLoad(id),
    enabled: !!id,
  })
}

export function useUpdateLoadStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateLoadStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loads'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
