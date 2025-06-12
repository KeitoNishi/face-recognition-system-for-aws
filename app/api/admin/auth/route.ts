import { type NextRequest, NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/auth"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  try {
    if (!isAdminAuthenticated(req)) {
      return NextResponse.json({ message: "認証に失敗しました" }, { status: 401 })
    }

    // 認証成功、Cookieにセッション情報を保存
    const cookieStore = cookies()
    cookieStore.set("admin_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 24時間
      path: "/",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin login error:", error)
    return NextResponse.json({ message: "ログイン処理中にエラーが発生しました" }, { status: 500 })
  }
}
