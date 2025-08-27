'use client'

import { useState, useEffect } from 'react'
import { Photo } from '../types'

// 子コンポーネントに切り出して、フックを正しい階層で使用
function ModalImage({ src }: { src: string }) {
  const [modalLoaded, setModalLoaded] = useState(false)
  return (
    <>
      {!modalLoaded && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          zIndex: 1
        }}></div>
      )}
      <img 
        src={src}
        alt=""
        style={{ 
          maxWidth: '100%', 
          height: 'auto',
          opacity: modalLoaded ? 1 : 0.3,
          transition: 'opacity 0.5s ease-in-out'
        }}
        loading="lazy"
        onLoad={() => setModalLoaded(true)}
      />
    </>
  )
}

interface PhotoGalleryProps {
  photos: Photo[]
  venueName: string
  onDownload: (photo: Photo) => Promise<boolean>
}

export default function PhotoGallery({ photos, venueName, onDownload }: PhotoGalleryProps) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())

  const handleImageLoad = (photoId: string) => {
    setLoadedImages(prev => new Set(prev).add(photoId))
  }

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, photo: Photo) => {
    const failed = (e.target as HTMLImageElement).src
    const fallback = photo.thumbUrl ?? `/api/photos/thumb?s3Key=${encodeURIComponent(photo.s3Key)}&w=480`
    console.error('Thumb load error:', failed, 'fallback->', fallback)
  }

  if (photos.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p>写真が見つかりませんでした。</p>
      </div>
    )
  }

  return (
    <>
      <h2>{venueName}</h2>
      
      <div id="gallery">
        {photos.map((photo, index) => (
          <div key={`${photo.s3Key}-${index}`}>
            <a href={`#${('photo_' + photo.s3Key).replace(/[^A-Za-z0-9_-]/g, '_')}`}>
              <figure>
                <div style={{ position: 'relative', width: '100%', height: '160px' }}>
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
                  {(() => {
                    // 新しいサムネイルAPIを使用
                    const thumbUrl = photo.thumbUrl || `/api/photos/thumb?s3Key=${encodeURIComponent(photo.s3Key)}&w=480`
                    const src320 = `/api/photos/thumb?s3Key=${encodeURIComponent(photo.s3Key)}&w=320`
                    const src480 = thumbUrl
                    const src640 = `/api/photos/thumb?s3Key=${encodeURIComponent(photo.s3Key)}&w=640`
                    return (
                      <img 
                        src={src480}
                        srcSet={`${src320} 320w, ${src480} 480w, ${src640} 640w`}
                        sizes="(max-width: 480px) 320px, (max-width: 768px) 480px, 640px"
                        alt=""
                        width={400}
                        height={160}
                        loading="lazy"
                        decoding="async"
                        fetchPriority={index < 3 ? 'high' : 'low'}
                        style={{
                          width: '100%',
                          height: '160px',
                          objectFit: 'contain',
                          backgroundColor: '#f8f9fa',
                          border: '1px solid #dee2e6',
                          opacity: loadedImages.has(photo.id) ? 1 : 0.3,
                          transition: 'opacity 0.3s ease-in-out'
                        }}
                        onLoad={() => handleImageLoad(photo.id)}
                        onError={(e) => {
                          handleImageError(e, photo)
                          // エラー時は元画像からサムネイル生成
                          const fallbackUrl = `/api/photos/thumb?s3Key=${encodeURIComponent(photo.s3Key)}&w=480`
                          ;(e.target as HTMLImageElement).src = fallbackUrl
                        }}
                      />
                    )
                  })()}
                </div>
              </figure>
            </a>
            <div id={`${('photo_' + photo.s3Key).replace(/[^A-Za-z0-9_-]/g, '_')}`} className="">
              <figure>
                <div style={{ position: 'relative', width: '100%', minHeight: '200px' }}>
                  {/* フックは子コンポーネントで使用 */}
                  <ModalImage src={photo.url} />
                </div>
              </figure>
              <p style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <a 
                  href="#" 
                  onClick={async (e) => {
                    e.preventDefault();
                    await onDownload(photo);
                  }}
                >
                  ダウンロード
                </a>
              </p>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
} 