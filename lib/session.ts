// セッション管理用のユーティリティ関数

export interface SessionState {
  authenticated: boolean
  loading: boolean
  error?: string
}

// セッション状態を確認
export async function checkSession(): Promise<SessionState> {
  try {
    const response = await fetch('/api/auth/check')
    if (response.ok) {
      const result = await response.json()
      return {
        authenticated: result.authenticated,
        loading: false
      }
    } else {
      return {
        authenticated: false,
        loading: false,
        error: 'セッション確認に失敗しました'
      }
    }
  } catch (error) {
    return {
      authenticated: false,
      loading: false,
      error: 'セッション確認に失敗しました'
    }
  }
}

// ログアウト処理
export async function logout(): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      return { success: true }
    } else {
      const result = await response.json()
      return { success: false, error: result.error }
    }
  } catch (error) {
    return { success: false, error: 'ログアウトに失敗しました' }
  }
}

// 認証が必要なページかどうかを判定
export function isProtectedRoute(pathname: string): boolean {
  const protectedRoutes = [
    '/gallery/venue_01',
    '/gallery/venue_02',
    '/gallery/venue_03',
    '/gallery/venue_04',
    '/gallery/venue_05',
    '/gallery/venue_06',
    '/gallery/venue_07',
    '/gallery/venue_08',
    '/gallery/venue_09',
    '/gallery/venue_10',
    '/gallery/venue_11',
    '/gallery/venue_12',
    '/gallery/venue_13',
    '/gallery/venue_14',
    '/gallery/venue_15',
  ]
  
  return protectedRoutes.some(route => pathname.startsWith(route))
} 