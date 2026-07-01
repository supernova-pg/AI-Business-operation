import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

export interface DashboardMetrics {
  pipelineValue: number
  pendingTasks: number
  leadConversionRate: number
  opportunityDistribution: { stage: string; count: number }[]
  aiAlerts: number
  recentActivities: { id: string; action: string; metadata: any; createdAt: string }[]
}

export type DashboardPeriod = '7d' | '30d' | '90d'

export function useDashboardMetrics() {
  const [period, setPeriod] = useState<DashboardPeriod>('30d')

  const { data, isLoading, error, refetch } = useQuery<{ data: DashboardMetrics }>({
    queryKey: ['dashboard-metrics', period],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/metrics?period=${period}`, {
        headers: { 'x-tenant-id': 'demo-tenant-1' } // Assignment scope assumption
      })
      if (!res.ok) throw new Error('Failed to fetch dashboard metrics')
      return res.json()
    },
    refetchInterval: 15000, // Background poll every 15s for realtime feel
    staleTime: 5000
  })

  return {
    metrics: data?.data,
    isLoading,
    error,
    period,
    setPeriod,
    refetch
  }
}
