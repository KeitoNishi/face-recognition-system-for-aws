import { NextRequest, NextResponse } from "next/server"
import { getVenueById } from "@/lib/db"

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

    const venue = await getVenueById(venueId)
    
    if (!venue) {
      return NextResponse.json(
        { error: "会場が見つかりません" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(venue)
  } catch (error) {
    console.error("会場取得エラー:", error)
    return NextResponse.json(
      { error: "会場の取得に失敗しました" },
      { status: 500 }
    )
  }
} 