import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { logger } from "./lib/logger"

export function middleware(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  const path = request.nextUrl.pathname;
  
  // リクエストIDをヘッダーに追加
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);
  
  // リクエスト開始ログ
  logger.info(`Request Started: ${request.method} ${path}`, { requestId });

  // 管理者ページへのアクセスはセッションを確認
  if (path.startsWith("/admin") && !path.startsWith("/admin/api") && path !== "/admin") {
    const session = request.cookies.get("admin_session")

    if (!session || session.value !== "authenticated") {
      logger.warn(`Admin access denied - No session: ${path}`, { requestId });
      return NextResponse.redirect(new URL("/admin", request.url))
    }

    logger.info(`Admin access granted: ${path}`, { requestId });
  }

  // ユーザーページへのアクセスはセッションを確認
  if (path.startsWith("/venues")) {
    const session = request.cookies.get("user_session")

    if (!session || session.value !== "authenticated") {
      logger.warn(`User access denied - No session: ${path}`, { requestId });
      return NextResponse.redirect(new URL("/", request.url))
    }

    logger.info(`User access granted: ${path}`, { requestId });
  }

  // レスポンスを作成
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // レスポンスヘッダーにリクエストIDを追加
  response.headers.set('x-request-id', requestId);

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/venues/:path*", "/api/:path*"],
}
