import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/auth"
import { createVenue } from "@/lib/db"

async function handler(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json({ message: "Method not allowed" }, { status: 405 })
  }

  try {
    const { name } = await req.json()

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ message: "会場名が必要です" }, { status: 400 })
    }

    const venue = await createVenue(name.trim())

    return NextResponse.json({ venue })
  } catch (error) {
    console.error("Create venue error:", error)
    return NextResponse.json({ message: "会場の作成中にエラーが発生しました" }, { status: 500 })
  }
}

export const POST = withAdminAuth(handler)
