'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Plus,
  Search,
  FileText,
  Truck,
  DollarSign,
  MapPin
} from 'lucide-react'
import Link from 'next/link'

const actions = [
  {
    title: 'New Load',
    description: 'Create a new load',
    href: '/dashboard/loads/new',
    icon: Plus,
    variant: 'default' as const,
  },
  {
    title: 'Find Trucks',
    description: 'Search DAT for capacity',
    href: '/dashboard/trucks/search',
    icon: Search,
    variant: 'outline' as const,
  },
  {
    title: 'Get Rates',
    description: 'Check market rates',
    href: '/dashboard/rates',
    icon: DollarSign,
    variant: 'outline' as const,
  },
  {
    title: 'Track Loads',
    description: 'View live tracking',
    href: '/dashboard/tracking',
    icon: MapPin,
    variant: 'outline' as const,
  },
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2">
          {actions.map((action) => (
            <Button
              key={action.title}
              variant={action.variant}
              className="h-auto justify-start gap-3 p-3"
              asChild
            >
              <Link href={action.href}>
                <action.icon className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs text-muted-foreground font-normal">
                    {action.description}
                  </div>
                </div>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
