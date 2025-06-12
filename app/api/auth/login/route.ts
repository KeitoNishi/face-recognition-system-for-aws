import { type NextRequest, NextResponse } from "next/server"
import { validateUserPassword } from "@/lib/auth"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()

    if (!validateUserPassword(password)) {
      return NextResponse.json({ message: "パスワードが正しくありません" }, { status: 401 })
    }

    // 認証成功、Cookieにセッション情報を保存
    const cookieStore = cookies()
    cookieStore.set("user_session", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 24時間
      path: "/",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "ログイン処理中にエラーが発生しました" }, { status: 500 })
  }
}
