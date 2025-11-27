'use client'

import { KPICards } from '@/components/dashboard/kpi-cards'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { RecentLoads } from '@/components/dashboard/recent-loads'
import { AlertsPanel } from '@/components/dashboard/alerts-panel'
import { useDashboardStats, useRecentLoads } from '@/hooks/use-dashboard'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

function KPISkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(8)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: loadsData, isLoading: loadsLoading } = useRecentLoads(5)

  // Transform loads data for the component
  const recentLoads = loadsData?.docs.map((load: any) => ({
    id: load.id,
    loadNumber: load.loadNumber,
    status: load.status,
    customer: typeof load.customer === 'object' ? load.customer?.companyName : 'Unknown',
    pickupCity: load.pickupAddress?.city || load.pickupLocation?.city || 'TBD',
    pickupState: load.pickupAddress?.state || load.pickupLocation?.state || '',
    deliveryCity: load.deliveryAddress?.city || load.deliveryLocation?.city || 'TBD',
    deliveryState: load.deliveryAddress?.state || load.deliveryLocation?.state || '',
    pickupDate: load.pickupDate,
    customerRate: load.customerRate || 0,
  })) || []

  // Mock alerts for now - typed array
  const alerts: Array<{
    id: string
    type: 'late' | 'missing-docs' | 'insurance' | 'tracking'
    title: string
    description: string
    link?: string
    severity: 'warning' | 'error' | 'info'
  }> = []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your transportation operations
        </p>
      </div>

      {/* KPI Cards */}
      {statsLoading ? (
        <KPISkeleton />
      ) : stats ? (
        <KPICards stats={stats} />
      ) : null}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Recent Loads */}
        <div className="lg:col-span-2 space-y-6">
          {loadsLoading ? (
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full mb-2" />
                ))}
              </CardContent>
            </Card>
          ) : (
            <RecentLoads loads={recentLoads} />
          )}
        </div>

        {/* Right Column - Quick Actions & Alerts */}
        <div className="space-y-6">
          <QuickActions />
          <AlertsPanel alerts={alerts} />
        </div>
      </div>
    </div>
  )
}
