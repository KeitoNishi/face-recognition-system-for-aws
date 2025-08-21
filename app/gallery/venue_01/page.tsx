'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { checkSession, logout } from '@/lib/session'
import Script from 'next/script'
import { NotificationService } from '@/app/components/NotificationService'
import VenueGalleryLayout from '@/app/components/VenueGalleryLayout'
import FilterSection from '@/app/components/FilterSection'
import PhotoGallery from '@/app/components/PhotoGallery'
import LoadingSpinner from '@/app/components/LoadingSpinner'
import { Photo, SessionState, FilterState } from '@/app/types'
import { getVenueById } from '@/app/config/venues'

export default function VenueGallery() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sessionState, setSessionState] = useState<SessionState>({ authenticated: false, loading: true })
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [filterState, setFilterState] = useState<FilterState>({
    isFiltering: false,
    filterProgress: 0,
    showAllPhotos: true,
    hasFace: false
  })
  const [isFilterSectionExpanded, setIsFilterSectionExpanded] = useState(false)
  const router = useRouter()

  const venue = getVenueById('venue_01')

  // セッション状態を確認
  useEffect(() => {
    const verifySession = async () => {
      const state = await checkSession()
      setSessionState(state)
      setFilterState(prev => ({ ...prev, hasFace: !!state.faceInfo }))
      
      // 認証されていない場合はログインページにリダイレクト
      if (!state.authenticated) {
        router.push('/login')
        return
      }
      
      // 認証されている場合は写真を取得
      fetchPhotos()
    }

    verifySession()
  }, [router])

  // modaalライブラリの初期化（写真が変わるたび再初期化）
  useEffect(() => {
    const initModaal = () => {
      console.log('=== MODAAL INITIALIZATION START ===');
      console.log('Window available:', typeof window !== 'undefined');
      console.log('jQuery available:', typeof window !== 'undefined' && (window as any).jQuery);
      console.log('jQuery version:', typeof window !== 'undefined' && (window as any).jQuery ? (window as any).jQuery.fn.jquery : 'N/A');
      console.log('Modaal available:', typeof window !== 'undefined' && (window as any).jQuery && (window as any).jQuery.fn.modaal);
      console.log('Gallery elements:', document.querySelectorAll('#gallery > div > a').length);
      
      if (typeof window !== 'undefined' && (window as any).jQuery && (window as any).jQuery.fn.modaal) {
        console.log('Initializing modaal...');
        try {
          // 既存のインスタンスをクローズ（多重初期化ケア）
          (window as any).jQuery("#gallery > div > a").modaal('close');
          (window as any).jQuery("#gallery > div > a").modaal({
            overlay_close: true,
            before_open: function() {
              console.log('Modaal opening...');
              try {
                const $ = (window as any).jQuery;
                const self: any = this;
                const $trigger = self && (self.$elem || self.$element || self.$el);
                const href: string | null = $trigger && $trigger.attr ? $trigger.attr('href') : (document.activeElement && (document.activeElement as HTMLAnchorElement).getAttribute('href'));
                const id = href && href.startsWith('#') ? href.substring(1) : null;
                if (id) {
                  const el = document.getElementById(id);
                  const img = el ? (el.querySelector('img[data-full]') as HTMLImageElement | null) : null;
                  const dataFull = img?.getAttribute('data-full') || '';
                  if (img && dataFull && !img.getAttribute('src')) {
                    console.log('Setting modal image src:', dataFull);
                    img.src = dataFull;
                  }
                }
              } catch (e) {
                console.error('before_open handler error', e);
              }
              document.documentElement.style.overflowY = 'hidden';
            },
            after_close: function() {
              console.log('Modaal closing...');
              document.documentElement.style.overflowY = 'scroll';
            }
          });
          console.log('Modaal initialized successfully');
        } catch (error) {
          console.error('Error initializing modaal:', error);
        }
      } else {
        console.log('jQuery or modaal not available, retrying in 1 second...');
        setTimeout(initModaal, 1000);
      }
    };

    const timer = setTimeout(initModaal, 500);
    return () => clearTimeout(timer);
  }, [photos])

  // S3から写真一覧を取得
  const fetchPhotos = async () => {
    try {
      const response = await fetch('/api/photos/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ venueId: 'venue_01' }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('API response:', result)
        const convertedPhotos = result.photos.map((photo: any) => ({
          ...photo,
          matched: false,
          confidence: 0,
        }))
        console.log('Converted photos:', convertedPhotos)
        setPhotos(convertedPhotos)
      } else {
        console.error('写真の取得に失敗しました')
      }
    } catch (error) {
      console.error('エラーが発生しました:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFaceFilter = async () => {
    setFilterState(prev => ({ ...prev, isFiltering: true, filterProgress: 0 }))
    
    try {
      setFilterState(prev => ({ ...prev, filterProgress: 10 }))
      const response = await fetch('/api/faces/ultra-fast-filter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          venueId: 'venue_01'
        }),
      })

      setFilterState(prev => ({ ...prev, filterProgress: 50 }))

      const result = await response.json()

      if (response.ok) {
        setFilterState(prev => ({ ...prev, filterProgress: 80 }))
        const matchedPhotos = result.matchedPhotos || []
        if (matchedPhotos.length === 0) {
          console.log('Ultra-fast filterでマッチなし。Efficient filterにフォールバック...')
          setFilterState(prev => ({ ...prev, filterProgress: 85 }))
          
          const efficientResponse = await fetch('/api/faces/efficient-filter', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              venueId: 'venue_01',
              useCache: true,
              batchSize: 5
            }),
          })
          
          const efficientResult = await efficientResponse.json()
          
          if (efficientResponse.ok) {
            const efficientMatchedPhotos = efficientResult.photos || []
            setPhotos(efficientMatchedPhotos)
            setFilterState(prev => ({ 
              ...prev, 
              showAllPhotos: false, 
              filterProgress: 100,
              isFiltering: false
            }))
            
            console.log(`Efficient filter完了: ${efficientMatchedPhotos.length}枚の写真を発見`)
            
            if (efficientMatchedPhotos.length > 0) {
              NotificationService.photoSearchSuccess(efficientMatchedPhotos.length, 'efficient')
            } else {
              NotificationService.photoSearchNoResults()
            }
          } else {
            setPhotos([])
            setFilterState(prev => ({ 
              ...prev, 
              showAllPhotos: false, 
              filterProgress: 100,
              isFiltering: false
            }))
            NotificationService.photoSearchFailed()
          }
        } else {
          setPhotos(matchedPhotos)
          setFilterState(prev => ({ 
            ...prev, 
            showAllPhotos: false, 
            filterProgress: 100,
            isFiltering: false
          }))
          
          console.log(`Ultra-fast filter完了: ${matchedPhotos.length}枚の写真を発見`)
          
          if (matchedPhotos.length > 0) {
            NotificationService.photoSearchSuccess(matchedPhotos.length, 'ultra-fast')
          } else {
            NotificationService.photoSearchNoResults()
          }
        }
      } else {
        if (result.error?.includes('顔写真が登録されていません') || result.code === 'NO_FACE_REGISTERED') {
          NotificationService.noFaceRegistered()
          router.push('/')
          return
        } else {
          NotificationService.faceFilterFailed(result.error)
        }
        console.error('Ultra-fast filterエラー:', result.error)
        setFilterState(prev => ({ ...prev, isFiltering: false }))
      }
    } catch (error) {
      console.error('ネットワークエラー:', error)
      NotificationService.networkError()
      setFilterState(prev => ({ ...prev, isFiltering: false }))
    }
  }

  const handleShowAll = async () => {
    await fetchPhotos()
    setFilterState(prev => ({ ...prev, showAllPhotos: true }))
  }

  const handleBack = () => {
    router.push('/')
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const result = await logout()
      if (result.success) {
        router.push('/login')
      } else {
        console.error('ログアウトエラー:', result.error)
      }
    } catch (error) {
      console.error('ログアウトエラー:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleDownload = async (photo: Photo) => {
    try {
      const response = await fetch('/api/photos/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          s3Key: photo.s3Key,
          filename: photo.filename,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = photo.filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        console.error('ダウンロードに失敗しました')
      }
    } catch (error) {
      console.error('ダウンロードエラー:', error)
    }
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
          onFilter={handleFaceFilter}
          onShowAll={handleShowAll}
          isExpanded={isFilterSectionExpanded}
          onToggleExpanded={() => setIsFilterSectionExpanded(!isFilterSectionExpanded)}
        />
        
        <section id="wrapper">
          <PhotoGallery
            photos={photos}
            venueName={venue ? `${venue.name}${venue.location}` : '第1会場（4F ホールC）'}
            onDownload={handleDownload}
          />
          
          <p className="btn btn_s">
            <a href="#" onClick={handleBack}>前のページに戻る</a>
          </p>
        </section>
      </VenueGalleryLayout>
    </>
  )
} 