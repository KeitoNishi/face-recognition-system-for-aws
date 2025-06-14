import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  try {
    // セッションCookieを削除
    const cookieStore = await cookies()
    cookieStore.delete("user_session")
    cookieStore.delete("admin_session")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ message: "ログアウト処理中にエラーが発生しました" }, { status: 500 })
  }
}
