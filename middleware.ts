import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 認証が必要なページのみチェック
  const protectedRoutes = ['/']
  const isProtectedRoute = protectedRoutes.some(route => pathname === route)
  
  if (isProtectedRoute) {
    const sessionId = request.cookies.get('session_id')?.value
    
    // セッションIDがない場合はログインページにリダイレクト
    if (!sessionId) {
      return NextResponse.redirect(new URL('/login', request.url))
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
     * - images (public images)
     * - style.css (public CSS)
     * - function.js (public JS)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|style.css|function.js).*)',
  ],
} 