import { Suspense } from "react"
import { getVenues } from "@/lib/db"
import { AdminHeader } from "@/components/admin-header"
import { VenueSelector } from "@/components/venue-selector"

export const dynamic = "force-dynamic"

async function VenuesList() {
  const venues = await getVenues()
  return <VenueSelector venues={venues} />
}

export default function AdminVenuesPage() {
  return (
    <div className="container mx-auto py-6">
      <AdminHeader />
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">管理画面</h1>
        <Suspense fallback={<div>会場情報を読み込み中...</div>}>
          <VenuesList />
        </Suspense>
      </div>
    </div>
  )
}
