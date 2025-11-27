'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Package,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Truck,
  Clock,
  CheckCircle2,
  FileText
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface KPICardProps {
  title: string
  value: string | number
  description?: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

function KPICard({ title, value, description, icon, trend, className }: KPICardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || trend) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            {trend && (
              <span
                className={cn(
                  'font-medium',
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.isPositive ? '+' : ''}
                {trend.value}%
              </span>
            )}
            {description && <span>{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface KPICardsProps {
  stats: {
    loadsToday: number
    loadsInTransit: number
    revenueMonth: number
    marginPercent: number
    openInvoices: number
    pendingDeliveries: number
    alertCount: number
    completedToday: number
  }
}

export function KPICards({ stats }: KPICardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Loads Today"
        value={stats.loadsToday}
        description="new loads created"
        icon={<Package className="h-4 w-4 text-muted-foreground" />}
      />
      <KPICard
        title="In Transit"
        value={stats.loadsInTransit}
        description="active shipments"
        icon={<Truck className="h-4 w-4 text-muted-foreground" />}
      />
      <KPICard
        title="Revenue (MTD)"
        value={formatCurrency(stats.revenueMonth)}
        trend={{ value: 12, isPositive: true }}
        description="vs last month"
        icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
      />
      <KPICard
        title="Avg Margin"
        value={`${stats.marginPercent}%`}
        trend={{ value: 2.5, isPositive: true }}
        description="vs last month"
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
      />
      <KPICard
        title="Open Invoices"
        value={stats.openInvoices}
        description="awaiting payment"
        icon={<FileText className="h-4 w-4 text-muted-foreground" />}
      />
      <KPICard
        title="Pending Deliveries"
        value={stats.pendingDeliveries}
        description="scheduled today"
        icon={<Clock className="h-4 w-4 text-muted-foreground" />}
      />
      <KPICard
        title="Completed Today"
        value={stats.completedToday}
        description="loads delivered"
        icon={<CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
      />
      <KPICard
        title="Alerts"
        value={stats.alertCount}
        description="need attention"
        icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />}
        className={stats.alertCount > 0 ? 'border-destructive/50' : ''}
      />
    </div>
  )
}
