import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default function CarriersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Carriers</h1>
          <p className="text-muted-foreground">
            Manage your carrier network
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/collections/carriers/create">
            <Plus className="mr-2 h-4 w-4" />
            Add Carrier
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Carrier List</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Carrier management coming soon. Use the{' '}
            <Link href="/admin/collections/carriers" className="text-primary hover:underline">
              Admin Panel
            </Link>{' '}
            in the meantime.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
