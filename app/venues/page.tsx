import { Suspense } from "react"
import { getVenues } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { UserHeader } from "@/components/user-header"
import { FaceRegistrationButton } from "@/components/face-registration-button"

export const dynamic = "force-dynamic"

async function VenuesList() {
  const venues = await getVenues()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {venues.map((venue) => (
        <Card key={venue.id} className="flex flex-col">
          <CardHeader>
            <CardTitle>{venue.name}</CardTitle>
            <CardDescription>{new Date(venue.created_at).toLocaleDateString("ja-JP")}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-sm text-muted-foreground">このイベント会場の写真を閲覧します</p>
          </CardContent>
          <CardFooter>
            <Link href={`/venues/${venue.id}`} className="w-full">
              <Button className="w-full">写真を見る</Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

export default function VenuesPage() {
  return (
    <div className="container mx-auto py-6">
      <UserHeader />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">会場一覧</h1>
        <FaceRegistrationButton />
      </div>
      <Suspense fallback={<div>会場情報を読み込み中...</div>}>
        <VenuesList />
      </Suspense>
    </div>
  )
}
