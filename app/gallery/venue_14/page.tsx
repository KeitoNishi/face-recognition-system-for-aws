'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
  const [showAllPhotos, setShowAllPhotos] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // S3から写真一覧を取得
    // S3から写真一覧を取得
  const fetchPhotos = async () => {
    try {
      const response = await fetch('/api/photos/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ venueId: 'venue_14' }),
      })

      if (response.ok) {
        const result = await response.json()
        // 顔認識フィルター用の形式に変換
        const convertedPhotos = result.photos.map((photo: any) => ({
          ...photo,
          matched: false,
          confidence: 0,
        }))
        setPhotos(convertedPhotos)
      } else {
        console.error('写真の取得に失敗しました')
      }
    } catch (error) {
      console.error('エラーが発生しました:', error)
    } finally {
      setIsLoading(false)
    }
  },
        body: JSON.stringify({ venueId: 'venue_14' }),
      })

      if (response.ok) {
        const result = await response.json()
        setPhotos(result.photos)
      } else {
        console.error('写真の取得に失敗しました')
      }
    } catch (error) {
      console.error('エラーが発生しました:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPhotos()
  }, [])

  const handleFaceFilter = async () => {
    setIsFiltering(true)
    
    try {
      const response = await fetch('/api/faces/filter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ venueId: 'venue_14' }),
      })

      if (response.ok) {
        const result = await response.json()
        // マッチした写真のみを表示
        const matchedPhotos = result.photos.filter((photo: Photo) => photo.matched)
        setPhotos(matchedPhotos)
        setShowAllPhotos(false)
      } else {
        console.error('顔認識フィルターに失敗しました')
      }
    } catch (error) {
      console.error('エラーが発生しました:', error)
    } finally {
      setIsFiltering(false)
    }
  }

  const handleShowAll = async () => {
    await fetchPhotos()
    setShowAllPhotos(true)
  }

    const handleBack = () => {
    router.push('/')
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
        // ダウンロードリンクを作成
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
          <h2>市民公開講座</h2>
          <p>写真を読み込み中...</p>
        </section>
      </div>
    )
  }

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
      
      <section id="upload">
        <dl>
          <dt>写真の絞り込み</dt>
          <dd>フォトギャラリー内の写真と登録された顔写真を照らし合わせ、一致した写真を絞り込んで表示します。</dd>
        </dl>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
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
        </div>
      </section>
      
      <section id="wrapper">
        <h2>市民公開講座</h2>
        
                <div id="gallery">
          {photos.map((photo) => (
            <div key={photo.id}>
              <a href={`#photo_${photo.id}`}>
                <figure>
                  <img 
                    src={photo.url} 
                    alt=""
                    style={photo.matched ? { border: '3px solid #ff6b6b' } : {}}
                  />
                </figure>
              </a>
              <div id={`photo_${photo.id}`} className="">
                <figure>
                  <img 
                    src={photo.url} 
                    alt=""
                  />
                </figure>
                <p>
                  <button 
                    onClick={() => handleDownload(photo)}
                    style={{
                      background: '#007bff',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    ダウンロード
                  </button>
                </p>
              </div>
            </div>
          ))}
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
    </div>
  )
} 