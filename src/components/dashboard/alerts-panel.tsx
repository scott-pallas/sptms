'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  Clock,
  FileX,
  Shield,
  X
} from 'lucide-react'
import Link from 'next/link'

interface Alert {
  id: string
  type: 'late' | 'missing-docs' | 'insurance' | 'tracking'
  title: string
  description: string
  link?: string
  severity: 'warning' | 'error' | 'info'
}

interface AlertsPanelProps {
  alerts: Alert[]
}

const alertIcons = {
  late: Clock,
  'missing-docs': FileX,
  insurance: Shield,
  tracking: AlertTriangle,
}

const severityColors = {
  warning: 'border-yellow-500 bg-yellow-50',
  error: 'border-red-500 bg-red-50',
  info: 'border-blue-500 bg-blue-50',
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <p>No alerts - all systems operational!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">
          Alerts
          <Badge variant="destructive" className="ml-2">
            {alerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.map((alert) => {
            const Icon = alertIcons[alert.type] || AlertTriangle

            return (
              <div
                key={alert.id}
                className={`flex items-start gap-3 rounded-lg border-l-4 p-3 ${severityColors[alert.severity]}`}
              >
                <Icon className="h-5 w-5 mt-0.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{alert.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {alert.description}
                  </p>
                  {alert.link && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 mt-1 text-xs"
                      asChild
                    >
                      <Link href={alert.link}>View details →</Link>
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
