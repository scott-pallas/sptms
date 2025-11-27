import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, DollarSign, Users } from 'lucide-react'
import Link from 'next/link'

export default function ReportsPage() {
  const reports = [
    {
      title: 'Profitability Summary',
      description: 'Overview of revenue, costs, and margins',
      icon: TrendingUp,
      href: '/api/reports/profitability?type=summary',
    },
    {
      title: 'Customer Analysis',
      description: 'Revenue and profitability by customer',
      icon: Users,
      href: '/api/reports/profitability?type=customers',
    },
    {
      title: 'Lane Analysis',
      description: 'Performance metrics by origin/destination',
      icon: BarChart3,
      href: '/api/reports/profitability?type=lanes',
    },
    {
      title: 'Revenue Report',
      description: 'Detailed revenue breakdown',
      icon: DollarSign,
      href: '/api/reports/profitability?type=loads',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Analytics and business intelligence
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.title} className="hover:bg-muted/50 transition-colors">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                <report.icon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg">{report.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{report.description}</p>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Interactive charts and dashboards coming soon. API endpoints are available
            at <code className="text-sm bg-muted px-1 py-0.5 rounded">/api/reports/profitability</code>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
