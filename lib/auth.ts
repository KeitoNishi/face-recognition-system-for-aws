import { type NextRequest, NextResponse } from "next/server"

// 管理者用ベーシック認証
export function isAdminAuthenticated(req: NextRequest) {
  const authHeader = req.headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return false
  }

  // Basic認証のデコード
  const base64Credentials = authHeader.split(" ")[1]
  const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8")
  const [username, password] = credentials.split(":")

  return username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD
}

// 管理者認証ミドルウェア
export function withAdminAuth(handler: Function) {
  return async (req: NextRequest) => {
    if (!isAdminAuthenticated(req)) {
      return new NextResponse("Unauthorized", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Admin Area"',
        },
      })
    }

    return handler(req)
  }
}

// ユーザー認証（共通パスワード）
export function validateUserPassword(password: string) {
  return password === process.env.USER_PASSWORD
}
