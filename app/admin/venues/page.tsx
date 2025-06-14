import { Suspense } from "react"
import { AdminHeader } from "@/components/admin-header"
import { VenueForm } from "@/components/venue-form"
import { getVenues } from "@/lib/db"
import Link from "next/link"

export const dynamic = "force-dynamic"

async function VenuesList() {
  const venues = await getVenues()

  return (
    <div className="space-y-4">
      {venues.map((venue) => (
        <div key={venue.id} className="flex justify-between items-center p-4 border rounded-lg">
          <div>
            <h3 className="font-semibold">{venue.name}</h3>
            <p className="text-sm text-gray-600">{new Date(venue.created_at).toLocaleDateString("ja-JP")}</p>
          </div>
          <Link href={`/admin/venues/${venue.id}/photos`} className="btn btn-primary">
            写真管理
          </Link>
        </div>
      ))}
    </div>
  )
}

export default function AdminVenuesPage() {
  return (
    <div className="container mx-auto py-6">
      <AdminHeader />
      <h1 className="text-3xl font-bold mb-6">会場管理</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">新規会場追加</h2>
          <VenueForm />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">既存会場</h2>
          <Suspense fallback={<div>会場一覧を読み込み中...</div>}>
            <VenuesList />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
