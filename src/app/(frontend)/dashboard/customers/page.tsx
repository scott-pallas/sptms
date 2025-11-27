import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer relationships
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/collections/customers/create">
            <Plus className="mr-2 h-4 w-4" />
            Add Customer
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Customer management coming soon. Use the{' '}
            <Link href="/admin/collections/customers" className="text-primary hover:underline">
              Admin Panel
            </Link>{' '}
            in the meantime.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
