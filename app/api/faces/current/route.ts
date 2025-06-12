import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { query } from "@/lib/db"

export async function GET(req: NextRequest) {
  // セッション確認
  const cookieStore = cookies()
  const session = cookieStore.get("user_session")

  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ message: "認証が必要です" }, { status: 401 })
  }

  try {
    // 最新の顔情報を取得
    const result = await query("SELECT * FROM users ORDER BY created_at DESC LIMIT 1")

    if (result.rows.length === 0) {
      return NextResponse.json({ message: "顔写真が登録されていません" }, { status: 404 })
    }

    const user = result.rows[0]

    return NextResponse.json({
      faceId: user.face_id,
      s3Key: user.photo_path,
    })
  } catch (error) {
    console.error("Get current face error:", error)
    return NextResponse.json({ message: "顔情報の取得中にエラーが発生しました" }, { status: 500 })
  }
}
