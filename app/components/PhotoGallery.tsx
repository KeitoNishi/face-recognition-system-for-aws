'use client'

import { useState } from 'react'
import { Photo } from '../types'

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
                  {(() => {
                    const base = photo.thumbUrl?.split('?')[0] ? `${photo.thumbUrl.split('?')[0]}?s3Key=${encodeURIComponent(photo.s3Key)}` : `/api/photos/thumb?s3Key=${encodeURIComponent(photo.s3Key)}`
                    const src320 = `${base}&w=320`
                    const src480 = `${base}&w=480`
                    const src640 = `${base}&w=640`
                    return (
                      <img 
                        src={src480}
                        srcSet={`${src320} 320w, ${src480} 480w, ${src640} 640w`}
                        sizes="(max-width: 480px) 320px, (max-width: 768px) 480px, 640px"
                        alt=""
                        width={400}
                        height={200}
                        loading="lazy"
                        decoding="async"
                        fetchPriority={index < 3 ? 'high' : 'low'}
                        style={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover',
                          border: photo.matched ? '3px solid #ff6b6b' : '1px solid #dee2e6',
                          opacity: loadedImages.has(photo.id) ? 1 : 0.3,
                          transition: 'opacity 0.3s ease-in-out'
                        }}
                        onLoad={() => handleImageLoad(photo.id)}
                        onError={(e) => {
                          handleImageError(e, photo)
                          const baseThumb = photo.thumbUrl?.split('?')[0] ? `${photo.thumbUrl.split('?')[0]}?s3Key=${encodeURIComponent(photo.s3Key)}` : `/api/photos/thumb?s3Key=${encodeURIComponent(photo.s3Key)}`
                          ;(e.target as HTMLImageElement).src = `${baseThumb}&w=480`
                        }}
                      />
                    )
                  })()}
                </div>
              </figure>
            </a>
            <div id={`${('photo_' + photo.s3Key).replace(/[^A-Za-z0-9_-]/g, '_')}`} className="">
              <figure>
                {(() => {
                  const base = photo.thumbUrl?.split('?')[0] ? `${photo.thumbUrl.split('?')[0]}?s3Key=${encodeURIComponent(photo.s3Key)}` : `/api/photos/thumb?s3Key=${encodeURIComponent(photo.s3Key)}`
                  return (
                    <img 
                      src={`${base}&w=1280`}
                      alt=""
                      style={{ maxWidth: '100%', height: 'auto' }}
                    />
                  )
                })()}
              </figure>
              <p style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    // 新規タブで原本を開く
                    window.open(photo.url, '_blank', 'noopener,noreferrer');
                  }}
                >
                  表示
                </a>
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