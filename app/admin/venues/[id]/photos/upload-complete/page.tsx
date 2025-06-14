import Link from "next/link"
import { getVenueById } from "@/lib/db"
import { AdminHeader } from "@/components/admin-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

interface UploadCompletePageProps {
  params: Promise<{
    id: string
  }>
}

export default async function UploadCompletePage({ params }: UploadCompletePageProps) {
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
      <div className="flex items-center justify-center mt-10">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <CardTitle className="text-2xl">アップロードが完了しました</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              {venue.name}の写真がアップロードされ、ウェブサイトに反映されました。
            </p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link href="/admin/venues">
              <Button variant="outline">会場一覧に戻る</Button>
            </Link>
            <Link href={`/venues/${venueId}`} target="_blank">
              <Button>ウェブサイトで確認</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
