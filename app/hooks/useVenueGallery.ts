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
    
    // 進捗バーの自動更新タイマー
    const progressTimer = setInterval(() => {
      setFilterState(prev => {
        if (prev.filterProgress < 90) {
          return { ...prev, filterProgress: prev.filterProgress + 2 }
        }
        return prev
      })
    }, 100) // 100msごとに2%ずつ増加（5秒で90%まで）
    
    try {
      const response = await fetch('/api/faces/efficient-filter', {
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

      const result = await response.json()

      // タイマーを停止
      clearInterval(progressTimer)

      if (response.ok) {
        const matchedPhotos = result.photos || []
        setPhotos(matchedPhotos)
        setFilterState(prev => ({ 
          ...prev, 
          showAllPhotos: false, 
          filterProgress: 100,
          isFiltering: false
        }))
        
        console.log(`Efficient filter完了: ${matchedPhotos.length}枚の写真を発見`)
        
        if (matchedPhotos.length > 0) {
          NotificationService.photoSearchSuccess(matchedPhotos.length, 'efficient')
        } else {
          NotificationService.photoSearchNoResults()
        }
      } else {
        if (result.error?.includes('顔写真が登録されていません') || result.code === 'NO_FACE_REGISTERED') {
          NotificationService.noFaceRegistered()
          return { redirect: true }
        } else {
          NotificationService.faceFilterFailed(result.error)
        }
        console.error('Efficient filterエラー:', result.error)
        setFilterState(prev => ({ ...prev, isFiltering: false }))
      }
    } catch (error) {
      // エラー時もタイマーを停止
      clearInterval(progressTimer)
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

  // 顔登録完了イベントで hasFace を立てる
  useEffect(() => {
    const handler = () => updateSessionState(true)
    if (typeof window !== 'undefined') {
      window.addEventListener('face-registered', handler)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('face-registered', handler)
      }
    }
  }, [updateSessionState])

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