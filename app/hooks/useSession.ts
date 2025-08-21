'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { checkSession, logout } from '@/lib/session'
import { SessionState } from '@/app/types'

export function useSession() {
  const [sessionState, setSessionState] = useState<SessionState>({ 
    authenticated: false, 
    loading: true 
  })
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  // セッション状態を確認（キャッシュ付き）
  const verifySession = async () => {
    try {
      // 既に認証済みの場合はスキップ
      if (sessionState.authenticated && !sessionState.loading) {
        return sessionState
      }
      
      const state = await checkSession()
      setSessionState(state)
      
      // 認証されていない場合はログインページにリダイレクト（ローディング中は除く）
      if (!state.authenticated && !state.loading) {
        console.log('認証されていないため、ログインページにリダイレクト')
        window.location.href = '/login'
      }
      
      return state
    } catch (error) {
      console.error('セッション確認エラー:', error)
      setSessionState({ authenticated: false, loading: false })
      window.location.href = '/login'
      return { authenticated: false, loading: false }
    }
  }

  // ログアウト処理
  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const result = await logout()
      if (result.success) {
        window.location.href = '/login'
      } else {
        console.error('ログアウトエラー:', result.error)
      }
    } catch (error) {
      console.error('ログアウトエラー:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  // 初期セッション確認
  useEffect(() => {
    verifySession()
  }, [router])

  return {
    sessionState,
    isLoggingOut,
    verifySession,
    handleLogout,
    hasFace: !!sessionState.faceInfo
  }
} 