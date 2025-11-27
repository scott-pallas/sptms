import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin } from 'lucide-react'

export default function TrackingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Live Tracking</h1>
        <p className="text-muted-foreground">
          Real-time visibility of all active shipments
        </p>
      </div>

      <Card className="min-h-[500px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Fleet Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Map Integration Coming Soon</p>
              <p className="text-sm mt-1">
                Real-time tracking with MacroPoint integration
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
