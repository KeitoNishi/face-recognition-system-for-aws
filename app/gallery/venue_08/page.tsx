'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import VenueGalleryLayout from '@/app/components/VenueGalleryLayout'
import FilterSection from '@/app/components/FilterSection'
import PhotoGallery from '@/app/components/PhotoGallery'
import LoadingSpinner from '@/app/components/LoadingSpinner'
import { useSession } from '@/app/hooks/useSession'
import { useVenueGallery } from '@/app/hooks/useVenueGallery'
import { usePhotoDownload } from '@/app/hooks/usePhotoDownload'
import { useModaal } from '@/app/hooks/useModaal'
import { getVenueById } from '@/app/config/venues'

export default function VenueGallery() {
  const [isFilterSectionExpanded, setIsFilterSectionExpanded] = useState(false)
  const router = useRouter()
  
  const venue = getVenueById('venue_08')
  
  // カスタムフックを使用
  const { sessionState, isLoggingOut, handleLogout, hasFace } = useSession()
  const { 
    photos, 
    isLoading, 
    filterState, 
    handleFaceFilter, 
    handleShowAll,
    updateSessionState 
  } = useVenueGallery({ 
    venueId: 'venue_08',
    onSessionVerified: (hasFace) => {
      // セッション確認後の処理
    }
  })
  const { downloadPhoto } = usePhotoDownload()
  
  // Modaal初期化
  useModaal(photos)

  // セッション状態が更新されたら、ギャラリーフックに通知
  useEffect(() => {
    if (sessionState.faceInfo !== undefined) {
      updateSessionState(!!sessionState.faceInfo)
    }
  }, [sessionState.faceInfo])

  // フィルター処理でリダイレクトが必要な場合
  const handleFilterWithRedirect = async () => {
    const result = await handleFaceFilter()
    if (result?.redirect) {
      router.push('/')
    }
  }

  const handleBack = () => {
    router.push('/')
  }

  console.log('Current state:', { isLoading, photosCount: photos.length, photos })
  
  if (isLoading) {
    return (
      <VenueGalleryLayout
        sessionState={sessionState}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
        loadingMessage={`写真を読み込み中... (${photos.length}件)`}
      >
        <section id="wrapper">
          <LoadingSpinner message={`写真を読み込み中... (${photos.length}件)`} size="large" />
        </section>
      </VenueGalleryLayout>
    )
  }

  return (
    <>
      <Script 
        src="https://code.jquery.com/jquery-3.6.0.min.js" 
        strategy="beforeInteractive"
        onReady={() => console.log('jQuery loaded in component')}
      />
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/Modaal/0.4.4/js/modaal.min.js" 
        strategy="afterInteractive"
        onReady={() => console.log('Modaal loaded in component')}
      />
      
      <VenueGalleryLayout
        sessionState={sessionState}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      >
        <FilterSection
          filterState={filterState}
          onFilter={handleFilterWithRedirect}
          onShowAll={handleShowAll}
          isExpanded={isFilterSectionExpanded}
          onToggleExpanded={() => setIsFilterSectionExpanded(!isFilterSectionExpanded)}
        />
        
        <section id="wrapper">
          <PhotoGallery
            photos={photos}
            venueName={venue ? `${venue.name}${venue.location}` : '第8会場（1F ホールD1）'}
            onDownload={downloadPhoto}
          />
          
          <p className="btn btn_s">
            <a href="#" onClick={handleBack}>前のページに戻る</a>
          </p>
        </section>
      </VenueGalleryLayout>
    </>
  )
} 