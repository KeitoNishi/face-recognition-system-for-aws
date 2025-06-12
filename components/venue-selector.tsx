"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Venue } from "@/types/models"

interface VenueSelectorProps {
  venues: Venue[]
}

export function VenueSelector({ venues }: VenueSelectorProps) {
  const [selectedVenue, setSelectedVenue] = useState<string>("")
  const router = useRouter()

  const handleUpload = () => {
    if (selectedVenue) {
      router.push(`/admin/venues/${selectedVenue}/photos`)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <RadioGroup value={selectedVenue} onValueChange={setSelectedVenue} className="space-y-3">
          {venues.map((venue) => (
            <div key={venue.id} className="flex items-center space-x-2">
              <RadioGroupItem value={venue.id.toString()} id={`venue-${venue.id}`} />
              <Label htmlFor={`venue-${venue.id}`} className="text-base">
                第{venue.name}会場
              </Label>
            </div>
          ))}
        </RadioGroup>

        <div className="mt-6">
          <Button onClick={handleUpload} disabled={!selectedVenue} className="w-full">
            アップロード
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
