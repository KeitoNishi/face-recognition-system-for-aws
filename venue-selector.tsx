"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { MapPin, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface Venue {
  id: number
  name: string
  photoCount: number
}

interface VenueSelectorProps {
  venues: Venue[]
  selectedVenue: number | null
  onVenueSelect: (venueId: number) => void
  loading: boolean
}

export function VenueSelector({ venues, selectedVenue, onVenueSelect, loading }: VenueSelectorProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (venues.length === 0) {
    return (
      <div className="text-center py-8">
        <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">利用可能な会場がありません</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {venues.map((venue) => (
        <Button
          key={venue.id}
          variant={selectedVenue === venue.id ? "default" : "outline"}
          className={cn(
            "w-full justify-start h-auto p-4 text-left",
            selectedVenue === venue.id && "ring-2 ring-primary ring-offset-2",
          )}
          onClick={() => onVenueSelect(venue.id)}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <div>
                <div className="font-medium text-sm">{venue.name}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ImageIcon className="h-3 w-3" />
                  {venue.photoCount}枚の写真
                </div>
              </div>
            </div>
            {venue.photoCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {venue.photoCount}
              </Badge>
            )}
          </div>
        </Button>
      ))}
    </div>
  )
}
