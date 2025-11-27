'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Filter, Download } from 'lucide-react'
import Link from 'next/link'
import { useLoads } from '@/hooks/use-loads'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

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

export default function LoadsPage() {
  const { data, isLoading } = useLoads({ limit: 20 })

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
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Loads</h1>
          <p className="text-muted-foreground">
            Manage and track all your shipments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button asChild>
            <Link href="/dashboard/loads/new">
              <Plus className="mr-2 h-4 w-4" />
              New Load
            </Link>
          </Button>
        </div>
      </div>

      {/* Loads Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Load #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Origin</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Pickup</TableHead>
                <TableHead className="text-right">Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : data?.docs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No loads found. Create your first load to get started.
                  </TableCell>
                </TableRow>
              ) : (
                data?.docs.map((load: any) => (
                  <TableRow key={load.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Link href={`/dashboard/loads/${load.id}`} className="font-medium hover:underline">
                        {load.loadNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn('text-xs', statusColors[load.status])}>
                        {statusLabels[load.status] || load.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {typeof load.customer === 'object' ? load.customer?.companyName : 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {load.pickupAddress?.city || 'TBD'}, {load.pickupAddress?.state || ''}
                    </TableCell>
                    <TableCell>
                      {load.deliveryAddress?.city || 'TBD'}, {load.deliveryAddress?.state || ''}
                    </TableCell>
                    <TableCell>
                      {load.pickupDate ? formatDate(load.pickupDate) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {load.customerRate ? formatCurrency(load.customerRate) : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {data.docs.length} of {data.totalDocs} loads
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={data.page === 1}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={data.page === data.totalPages}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
