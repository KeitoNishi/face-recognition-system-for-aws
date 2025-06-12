import { Suspense } from "react"
import { getVenueById, getPhotosByVenueId } from "@/lib/db"
import { getSignedPhotoUrl } from "@/lib/aws"
import { UserHeader } from "@/components/user-header"
import { PhotoGrid } from "@/components/photo-grid"
import { FaceFilterButton } from "@/components/face-filter-button"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

interface VenuePageProps {
  params: {
    id: string
  }
}

async function VenuePhotos({ venueId }: { venueId: number }) {
  const photos = await getPhotosByVenueId(venueId)

  // 署名付きURLを取得
  const photosWithUrls = await Promise.all(
    photos.map(async (photo) => {
      const url = await getSignedPhotoUrl(photo.s3_key)
      return { ...photo, url }
    }),
  )

  return <PhotoGrid photos={photosWithUrls} />
}

export default async function VenuePage({ params }: VenuePageProps) {
  const venueId = Number.parseInt(params.id)

  if (isNaN(venueId)) {
    return notFound()
  }

  const venue = await getVenueById(venueId)

  if (!venue) {
    return notFound()
  }

  return (
    <div className="container mx-auto py-6">
      <UserHeader />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{venue.name}</h1>
        <FaceFilterButton venueId={venueId} />
      </div>
      <Suspense fallback={<div>写真を読み込み中...</div>}>
        <VenuePhotos venueId={venueId} />
      </Suspense>
    </div>
  )
}
