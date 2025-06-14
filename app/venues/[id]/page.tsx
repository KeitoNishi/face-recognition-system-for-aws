import { Suspense } from "react"
import { getVenueById, getPhotosByVenueId } from "@/lib/db"
import { getSignedPhotoUrl } from "@/lib/aws"
import { VenueClient } from "@/components/venue-client"
import { notFound } from "next/navigation"
import type { Photo } from "@/types/models"

export const dynamic = "force-dynamic"

interface VenuePageProps {
  params: {
    id: string
  }
}

async function getVenueData(venueId: number) {
  const [venue, photos] = await Promise.all([
    getVenueById(venueId),
    getPhotosByVenueId(venueId)
  ])

  if (!venue) {
    return null
  }

  // 署名付きURLを取得
  const photosWithUrls = await Promise.all(
    photos.map(async (photo) => {
      const url = await getSignedPhotoUrl(photo.s3_key)
      return { 
        id: photo.id,
        venue_id: photo.venue_id,
        filename: photo.filename,
        s3_key: photo.s3_key,
        uploaded_at: photo.uploaded_at,
        url 
      } as Photo & { url: string }
    }),
  )

  return { venue, photos: photosWithUrls }
}

export default async function VenuePage({ params }: VenuePageProps) {
  const venueId = Number.parseInt(params.id)

  if (isNaN(venueId)) {
    return notFound()
  }

  const data = await getVenueData(venueId)

  if (!data) {
    return notFound()
  }

  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <VenueClient 
        venue={data.venue} 
        venueId={venueId} 
        initialPhotos={data.photos} 
      />
    </Suspense>
  )
}
