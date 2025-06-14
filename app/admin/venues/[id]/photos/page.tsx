import { getVenueById } from "@/lib/db"
import { AdminHeader } from "@/components/admin-header"
import { PhotoUploader } from "@/components/photo-uploader"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

interface AdminVenuePhotosPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AdminVenuePhotosPage({ params }: AdminVenuePhotosPageProps) {
  const resolvedParams = await params
  const venueId = Number.parseInt(resolvedParams.id)

  if (isNaN(venueId)) {
    return notFound()
  }

  const venue = await getVenueById(venueId)

  if (!venue) {
    return notFound()
  }

  return (
    <div className="container mx-auto py-6">
      <AdminHeader />
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{venue.name} - 写真管理</h1>
        <PhotoUploader venueId={venueId} />
      </div>
    </div>
  )
}
