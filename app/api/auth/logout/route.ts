import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  try {
    // セッションCookieを削除
    const cookieStore = cookies()
    cookieStore.delete("user_session")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ message: "ログアウト処理中にエラーが発生しました" }, { status: 500 })
  }
}
