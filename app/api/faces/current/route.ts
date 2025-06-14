import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  // セッション確認
  const cookieStore = await cookies()
  const session = cookieStore.get("user_session")

  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ message: "認証が必要です" }, { status: 401 })
  }

  try {
    // 現在のシステムでは顔登録機能は無効化されているため、
    // 常にfalseを返す
    return NextResponse.json({
      hasRegisteredFace: false,
      message: "顔登録機能は現在無効化されています"
    })
  } catch (error) {
    console.error("Get current face error:", error)
    return NextResponse.json({ message: "顔情報の取得中にエラーが発生しました" }, { status: 500 })
  }
}
