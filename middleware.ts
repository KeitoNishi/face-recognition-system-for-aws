import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // 管理者ページへのアクセスはセッションを確認
  if (path.startsWith("/admin") && !path.startsWith("/admin/api") && path !== "/admin") {
    const session = request.cookies.get("admin_session")

    if (!session || session.value !== "authenticated") {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
  }

  // ユーザーページへのアクセスはセッションを確認
  if (path.startsWith("/venues")) {
    const session = request.cookies.get("user_session")

    if (!session || session.value !== "authenticated") {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
