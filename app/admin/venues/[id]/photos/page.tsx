"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminHeader } from "@/components/admin-header"
import { PhotoUploader } from "@/components/photo-uploader"
import { PhotoManager } from "@/components/photo-manager"
import { VenueDeleteButton } from "@/components/venue-delete-button"

interface AdminVenuePhotosPageProps {
  params: {
    id: string
  }
}

interface Venue {
  id: number
  name: string
}

export default function AdminVenuePhotosPage({ params }: AdminVenuePhotosPageProps) {
  const [venue, setVenue] = useState<Venue | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const venueId = Number.parseInt(params.id)

  useEffect(() => {
    if (isNaN(venueId)) {
      router.push('/admin/venues')
      return
    }

    fetchVenue()
  }, [venueId, router])

  const fetchVenue = async () => {
    try {
      const response = await fetch(`/api/venues/${venueId}`)
      if (!response.ok) {
        router.push('/admin/venues')
        return
      }
      const venueData = await response.json()
      setVenue(venueData)
    } catch (error) {
      console.error("会場データの取得に失敗しました:", error)
      router.push('/admin/venues')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>読み込み中...</div>
      </div>
    )
  }

  if (!venue) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{venue.name} - 写真管理</h1>
          <VenueDeleteButton venueId={venueId} venueName={venue.name} />
        </div>
        
        {/* アップロードセクション */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <PhotoUploader venueId={venueId} />
        </div>

        {/* 写真管理セクション */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <PhotoManager venueId={venueId} />
        </div>
      </div>
    </div>
  )
}
