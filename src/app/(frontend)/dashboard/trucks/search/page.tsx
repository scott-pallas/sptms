'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Truck } from 'lucide-react'

export default function TruckSearchPage() {
  const [originCity, setOriginCity] = useState('')
  const [originState, setOriginState] = useState('')
  const [destCity, setDestCity] = useState('')
  const [destState, setDestState] = useState('')
  const [equipmentType, setEquipmentType] = useState('')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Find Trucks</h1>
        <p className="text-muted-foreground">
          Search DAT load board for available capacity
        </p>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle>Search Criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Origin City</Label>
              <Input
                placeholder="e.g., Dallas"
                value={originCity}
                onChange={(e) => setOriginCity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Origin State</Label>
              <Input
                placeholder="e.g., TX"
                value={originState}
                onChange={(e) => setOriginState(e.target.value)}
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Equipment Type</Label>
              <Select value={equipmentType} onValueChange={setEquipmentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dry-van">Dry Van</SelectItem>
                  <SelectItem value="reefer">Reefer</SelectItem>
                  <SelectItem value="flatbed">Flatbed</SelectItem>
                  <SelectItem value="step-deck">Step Deck</SelectItem>
                  <SelectItem value="power-only">Power Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Destination City (Optional)</Label>
              <Input
                placeholder="e.g., Houston"
                value={destCity}
                onChange={(e) => setDestCity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Destination State</Label>
              <Input
                placeholder="e.g., TX"
                value={destState}
                onChange={(e) => setDestState(e.target.value)}
                maxLength={2}
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full">
                <Search className="mr-2 h-4 w-4" />
                Search Trucks
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Available Trucks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Truck className="h-12 w-12 mb-4 opacity-50" />
            <p className="font-medium">Enter search criteria above</p>
            <p className="text-sm mt-1">
              Results from DAT will appear here
            </p>
            <p className="text-xs mt-4 text-center max-w-md">
              Note: DAT integration requires API credentials. Configure them in your environment variables.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
