import { NextRequest, NextResponse } from "next/server"
import { getPhotoCountByVenueId } from "@/lib/db"

interface Params {
  id: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const venueId = parseInt(params.id)
    
    if (isNaN(venueId)) {
      return NextResponse.json(
        { success: false, message: "Invalid venue ID" },
        { status: 400 }
      )
    }

    const count = await getPhotoCountByVenueId(venueId)
    
    return NextResponse.json({
      success: true,
      count
    })
  } catch (error) {
    console.error("Error fetching photo count:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch photo count" },
      { status: 500 }
    )
  }
} 