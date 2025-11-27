import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Carrier Payments</h1>
          <p className="text-muted-foreground">
            Manage carrier pay sheets and accounts payable
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/collections/carrier-payments/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Pay Sheet
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment List</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Payment management coming soon. Use the{' '}
            <Link href="/admin/collections/carrier-payments" className="text-primary hover:underline">
              Admin Panel
            </Link>{' '}
            in the meantime.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
