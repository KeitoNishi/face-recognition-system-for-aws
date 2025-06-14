import { NextRequest, NextResponse } from "next/server"
import { getPhotoCountByVenueId } from "@/lib/db"

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

    const count = await getPhotoCountByVenueId(venueId)
    
    return NextResponse.json({ count })
  } catch (error) {
    console.error("写真数取得エラー:", error)
    return NextResponse.json(
      { error: "写真数の取得に失敗しました" },
      { status: 500 }
    )
  }
} 