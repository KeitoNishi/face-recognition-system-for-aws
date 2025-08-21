'use client'

import { Photo } from '@/app/types'

export function usePhotoDownload() {
  const downloadPhoto = async (photo: Photo): Promise<boolean> => {
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
        return true
      } else {
        console.error('ダウンロードに失敗しました')
        return false
      }
    } catch (error) {
      console.error('ダウンロードエラー:', error)
      return false
    }
  }

  return {
    downloadPhoto
  }
} 