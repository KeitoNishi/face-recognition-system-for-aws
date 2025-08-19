'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { checkSession, logout } from '@/lib/session'
import Script from 'next/script'

interface Photo {
  id: string
  filename: string
  s3Key: string
  url: string
  matched: boolean
  confidence?: number
  size?: number
  lastModified?: Date
}

export default function VenueGallery() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isFiltering, setIsFiltering] = useState(false)
  const [filterProgress, setFilterProgress] = useState(0)
  const [showAllPhotos, setShowAllPhotos] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [sessionState, setSessionState] = useState({ authenticated: false, loading: true })
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  // セッション状態を確認
  useEffect(() => {
    const verifySession = async () => {
      const state = await checkSession()
      setSessionState(state)
      
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

  // modaalライブラリの初期化
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
          // 既存のmodaalを破棄
          (window as any).jQuery("#gallery > div > a").modaal('close');
          
          // 新しいmodaalを初期化
          (window as any).jQuery("#gallery > div > a").modaal({
            overlay_close: true,
            before_open: function() {
              console.log('Modaal opening...');
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
        console.log('jQuery or modaal not available, retrying in 2 seconds...');
        // 再試行
        setTimeout(initModaal, 2000);
      }
    };

    // 初回実行を遅延
    const timer = setTimeout(initModaal, 2000);
    return () => clearTimeout(timer);
  }, [photos]);

  // S3から写真一覧を取得
  const fetchPhotos = async () => {
    try {
      const response = await fetch('/api/photos/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ venueId: 'venue_13' }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('API response:', result)
        // 顔認識フィルター用の形式に変換
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
    setIsFiltering(true)
    setFilterProgress(0)
    
    try {
      // 進捗表示の開始
      setFilterProgress(10)
      
      // Ultra-fast filter APIを使用（最速）
      const response = await fetch('/api/faces/ultra-fast-filter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          venueId: 'venue_13'
        }),
      })

      setFilterProgress(50)

      const result = await response.json()

      if (response.ok) {
        setFilterProgress(80)
        
        // マッチした写真のみを表示
        const matchedPhotos = result.matchedPhotos || []
        setPhotos(matchedPhotos)
        setShowAllPhotos(false)
        setFilterProgress(100)
        
        console.log(`Ultra-fast filter完了: ${matchedPhotos.length}枚の写真を発見`)
        
        // 成功メッセージを表示
        if (matchedPhotos.length > 0) {
          alert(`${matchedPhotos.length}枚の写真が見つかりました！`)
        } else {
          alert('該当する写真が見つかりませんでした。')
        }
      } else {
        // エラーメッセージを表示
        if (result.error?.includes('顔写真が登録されていません') || result.code === 'NO_FACE_REGISTERED') {
          alert('顔写真が登録されていません。まず顔写真を登録してください。')
          // メインページにリダイレクト
          router.push('/')
          return        } else {
          alert(result.error || '顔認識フィルターに失敗しました')
        }
        console.error('Ultra-fast filterエラー:', result.error)
      }
    } catch (error) {
      console.error('ネットワークエラー:', error)
      alert('ネットワークエラーが発生しました。再度お試しください。')
    } finally {
      setIsFiltering(false)
      setFilterProgress(0)
    }
  }

  const handleShowAll = async () => {
    await fetchPhotos()
    setShowAllPhotos(true)
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

  const handleImageLoad = (photoId: string) => {
    setLoadedImages(prev => new Set(prev).add(photoId))
    console.log(`Image loaded: ${photoId}`)
    setLoadedImages(prev => new Set(prev).add(photoId))
  }

  const handleImageError = (photo: Photo) => {
    console.error('Image load error:', photo.url)
  }

  console.log('Current state:', { isLoading, photosCount: photos.length, photos })
  
  // セッション確認中
  if (sessionState.loading) {
    return (
      <div id="container">
        <section id="mv">
          <div>
            <h1><img src="/images/title.svg" alt="第129回日本眼科学会総会 フォトギャラリー"/></h1>
            <div>
              <p><img src="/images/date.svg" alt="会期：2025年4月17日（木）～4月20日（日）"/></p>
              <p><img src="/images/venue.svg" alt="会場：東京国際フォーラム"/></p>
            </div>
          </div>
        </section>
        
        <section id="wrapper">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ 
              width: '50px', 
              height: '50px', 
              border: '3px solid #f3f3f3', 
              borderTop: '3px solid #007bff', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <p>認証状態を確認中...</p>
          </div>
        </section>
        
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  // 認証されていない場合
  if (!sessionState.authenticated) {
    return null // ログインページにリダイレクトされる
  }
  
  if (isLoading) {
    return (
      <div id="container">
        <section id="mv">
          <div>
            <h1><img src="/images/title.svg" alt="第129回日本眼科学会総会 フォトギャラリー"/></h1>
            <div>
              <p><img src="/images/date.svg" alt="会期：2025年4月17日（木）～4月20日（日）"/></p>
              <p><img src="/images/venue.svg" alt="会場：東京国際フォーラム"/></p>
            </div>
          </div>
        </section>
        
        <section id="wrapper">
          <h2>第13会場（5F ホールB5（9））</h2>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ 
              width: '50px', 
              height: '50px', 
              border: '3px solid #f3f3f3', 
              borderTop: '3px solid #007bff', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <p>写真を読み込み中... ({photos.length}件)</p>
          </div>
        </section>
        
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
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
      <div id="container">
        <section id="mv">
          <div>
            <h1><img src="/images/title.svg" alt="第129回日本眼科学会総会 フォトギャラリー"/></h1>
            <div>
              <p><img src="/images/date.svg" alt="会期：2025年4月17日（木）～4月20日（日）"/></p>
              <p><img src="/images/venue.svg" alt="会場：東京国際フォーラム"/></p>
            </div>
          </div>
        </section>
      
      <section id="upload">
        <dl>
          <dt>写真の絞り込み</dt>
          <dd>フォトギャラリー内の写真と登録された顔写真を照らし合わせ、一致した写真を絞り込んで表示します。</dd>
        </dl>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
          <input 
            className="upload_btn" 
            type="button" 
            value={isFiltering ? "処理中..." : "写真を絞り込む"}
            onClick={handleFaceFilter}
            disabled={isFiltering}
          />
          {!showAllPhotos && (
            <input 
              className="upload_btn" 
              type="button" 
              value="全ての写真を表示"
              onClick={handleShowAll}
            />
          )}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            style={{
              padding: '8px 16px',
              backgroundColor: isLoggingOut ? '#6c757d' : '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoggingOut ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              transition: 'background-color 0.3s'
            }}
          >
            {isLoggingOut ? 'ログアウト中...' : 'ログアウト'}
          </button>
        </div>
      </section>
      
      <section id="wrapper">
        <h2>第13会場（5F ホールB5（9））</h2>
        
        <div id="gallery">
          {photos.map((photo) => (
            <div key={photo.id}>
              <a href={`#photo_${photo.id}`}>
                <figure>
                                  <div style={{ position: 'relative', width: '100%', height: '200px' }}>
                  {!loadedImages.has(photo.id) && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '30px',
                      height: '30px',
                      border: '3px solid #f3f3f3',
                      borderTop: '3px solid #007bff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      zIndex: 1
                    }}></div>
                  )}
                  <img 
                    src={photo.url} 
                    alt=""
                    style={{
                      width: '100%',
                      height: '200px',
                      objectFit: 'cover',
                      border: photo.matched ? '3px solid #ff6b6b' : '1px solid #dee2e6',
                      opacity: loadedImages.has(photo.id) ? 1 : 0.3,
                      transition: 'opacity 0.3s ease-in-out'
                    }}
                    loading="lazy"
                    onLoad={() => handleImageLoad(photo.id)}
                    onError={() => handleImageError(photo)}
                  />
                </div>
                </figure>
              </a>
              <div id={`photo_${photo.id}`} className="">
                <figure>
                  <img 
                    src={photo.url} 
                    alt=""
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                </figure>
                <p>
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      const link = document.createElement('a');
                      link.href = photo.url;
                      link.download = photo.filename;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    ダウンロード
                  </a>
                </p>
              </div>
            </div>
          ))}
        </div>
        
        <p className="btn btn_s">
          <a href="#" onClick={handleBack}>前のページに戻る</a>
        </p>
      </section>
      
      <footer>
        <p>&copy; 2025- The 129th Annual Meeting of the Japanese Ophthalmological Society.</p>
      </footer>
      
      <p id="pagetop"><a href="#"></a></p>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
    </>
  )
}