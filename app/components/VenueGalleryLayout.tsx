'use client'

import { ReactNode } from 'react'
import MVSection from './MVSection'
import LoadingSpinner from './LoadingSpinner'
import { SessionState } from '../types'

interface VenueGalleryLayoutProps {
  children: ReactNode
  sessionState: SessionState
  onLogout: () => Promise<void>
  isLoggingOut: boolean
  loadingMessage?: string
}

export default function VenueGalleryLayout({
  children,
  sessionState,
  onLogout,
  isLoggingOut,
  loadingMessage = '認証状態を確認中...'
}: VenueGalleryLayoutProps) {
  // セッション確認中
  if (sessionState.loading) {
    return (
      <div id="container">
        <MVSection 
          onLogout={onLogout} 
          isLoggingOut={isLoggingOut} 
        />
        
        <section id="wrapper">
          <LoadingSpinner message={loadingMessage} size="large" />
        </section>
      </div>
    )
  }

  // 認証されていない場合
  if (!sessionState.authenticated) {
    return null // ログインページにリダイレクトされる
  }

  return (
    <div id="container">
      <MVSection 
        onLogout={onLogout} 
        isLoggingOut={isLoggingOut} 
      />
      
      {children}
      
      <footer>
        <p>&copy; 2025- The 129th Annual Meeting of the Japanese Ophthalmological Society.</p>
      </footer>
      
      <p id="pagetop"><a href="#"></a></p>
    </div>
  )
} 