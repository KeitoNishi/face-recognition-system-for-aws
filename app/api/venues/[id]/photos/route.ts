import { NextRequest, NextResponse } from "next/server"
import { getPhotosByVenueId } from "@/lib/db"
import { getSignedPhotoUrl } from "@/lib/aws"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const venueId = parseInt(params.id)
    
    if (isNaN(venueId)) {
      return NextResponse.json(
        { error: "無効な会場IDです" },
        { status: 400 }
      )
    }

    const photos = await getPhotosByVenueId(venueId)
    
    // 各写真にS3の署名付きURLを追加
    const photosWithUrls = await Promise.all(
      photos.map(async (photo) => {
        const s3_url = await getSignedPhotoUrl(photo.s3_key)
        return {
          ...photo,
          s3_url
        }
      })
    )
    
    return NextResponse.json({ photos: photosWithUrls })
  } catch (error) {
    console.error("写真取得エラー:", error)
    return NextResponse.json(
      { error: "写真の取得に失敗しました" },
      { status: 500 }
    )
  }
} 