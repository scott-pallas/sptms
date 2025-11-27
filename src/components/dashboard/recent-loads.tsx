'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Load {
  id: string
  loadNumber: string
  status: string
  customer: string
  pickupCity: string
  pickupState: string
  deliveryCity: string
  deliveryState: string
  pickupDate: string
  customerRate: number
}

interface RecentLoadsProps {
  loads: Load[]
}

const statusColors: Record<string, string> = {
  booked: 'bg-blue-100 text-blue-800',
  dispatched: 'bg-purple-100 text-purple-800',
  'in-transit': 'bg-yellow-100 text-yellow-800',
  delivered: 'bg-green-100 text-green-800',
  invoiced: 'bg-orange-100 text-orange-800',
  paid: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
  tonu: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  booked: 'Booked',
  dispatched: 'Dispatched',
  'in-transit': 'In Transit',
  delivered: 'Delivered',
  invoiced: 'Invoiced',
  paid: 'Paid',
  cancelled: 'Cancelled',
  tonu: 'TONU',
}

export function RecentLoads({ loads }: RecentLoadsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Recent Loads</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/loads">
            View all
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {loads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No loads yet</p>
            <Button className="mt-4" asChild>
              <Link href="/dashboard/loads/new">Create your first load</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {loads.map((load) => (
              <Link
                key={load.id}
                href={`/dashboard/loads/${load.id}`}
                className="block"
              >
                <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{load.loadNumber}</span>
                      <Badge
                        variant="secondary"
                        className={cn('text-xs', statusColors[load.status])}
                      >
                        {statusLabels[load.status] || load.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {load.pickupCity}, {load.pickupState}
                      </span>
                      <ArrowRight className="h-3 w-3 mx-1" />
                      <span>
                        {load.deliveryCity}, {load.deliveryState}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {load.customer} • Pickup: {formatDate(load.pickupDate)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(load.customerRate)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
