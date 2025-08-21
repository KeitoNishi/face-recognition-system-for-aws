'use client'

import { useState, useEffect, useCallback } from 'react'
import { Photo, FilterState } from '@/app/types'
import { NotificationService } from '@/app/components/NotificationService'

interface UseVenueGalleryOptions {
  venueId: string
  onSessionVerified?: (hasFace: boolean) => void
}

export function useVenueGallery({ venueId, onSessionVerified }: UseVenueGalleryOptions) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterState, setFilterState] = useState<FilterState>({
    isFiltering: false,
    filterProgress: 0,
    showAllPhotos: true,
    hasFace: false
  })

  // S3から写真一覧を取得
  const fetchPhotos = async () => {
    try {
      const response = await fetch('/api/photos/list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ venueId }),
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

  // 顔写真フィルター処理
  const handleFaceFilter = async () => {
    setFilterState(prev => ({ ...prev, isFiltering: true, filterProgress: 0 }))
    
    try {
      setFilterState(prev => ({ ...prev, filterProgress: 10 }))
      const response = await fetch('/api/faces/ultra-fast-filter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ venueId }),
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
              venueId,
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
          return { redirect: true }
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
    
    return { redirect: false }
  }

  // 全ての写真を表示
  const handleShowAll = async () => {
    await fetchPhotos()
    setFilterState(prev => ({ ...prev, showAllPhotos: true }))
  }

  // セッション状態更新
  const updateSessionState = useCallback((hasFace: boolean) => {
    setFilterState(prev => ({ ...prev, hasFace }))
    onSessionVerified?.(hasFace)
  }, [onSessionVerified])

  // 初期化
  useEffect(() => {
    fetchPhotos()
  }, [venueId])

  return {
    photos,
    isLoading,
    filterState,
    fetchPhotos,
    handleFaceFilter,
    handleShowAll,
    updateSessionState
  }
} 