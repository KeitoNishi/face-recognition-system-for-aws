"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Trash2, Download, Eye, CheckSquare, Square } from "lucide-react"
import Image from "next/image"

interface Photo {
  id: number
  filename: string
  s3_key: string
  s3_url: string
  uploaded_at: string
}

interface PhotoManagerProps {
  venueId: number
}

export function PhotoManager({ venueId }: PhotoManagerProps) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null)

  useEffect(() => {
    fetchPhotos()
  }, [venueId])

  const fetchPhotos = async () => {
    try {
      const response = await fetch(`/api/venues/${venueId}/photos`)
      if (response.ok) {
        const data = await response.json()
        setPhotos(data.photos || [])
      }
    } catch (error) {
      console.error("写真の取得に失敗しました:", error)
    } finally {
      setLoading(false)
    }
  }

  const togglePhotoSelection = (photoId: number) => {
    const newSelected = new Set(selectedPhotos)
    if (newSelected.has(photoId)) {
      newSelected.delete(photoId)
    } else {
      newSelected.add(photoId)
    }
    setSelectedPhotos(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedPhotos.size === photos.length) {
      setSelectedPhotos(new Set())
    } else {
      setSelectedPhotos(new Set(photos.map(p => p.id)))
    }
  }

  const handleDeleteSelected = () => {
    if (selectedPhotos.size === 0) return
    setShowDeleteDialog(true)
  }

  const confirmDeletePhotos = async () => {
    if (selectedPhotos.size === 0) return

    setIsDeleting(true)
    try {
      const deletePromises = Array.from(selectedPhotos).map(photoId =>
        fetch(`/api/admin/photos/${photoId}`, { method: "DELETE" })
      )

      const results = await Promise.all(deletePromises)
      const failedDeletes = results.filter(r => !r.ok)

      if (failedDeletes.length === 0) {
        alert(`${selectedPhotos.size}枚の写真を削除しました`)
      } else {
        alert(`${results.length - failedDeletes.length}枚削除、${failedDeletes.length}枚失敗`)
      }

      // 写真リストを再読み込み
      await fetchPhotos()
      setSelectedPhotos(new Set())
      setShowDeleteDialog(false)
    } catch (error) {
      console.error("写真削除エラー:", error)
      alert("写真の削除中にエラーが発生しました")
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePreviewPhoto = (photo: Photo) => {
    setPreviewPhoto(photo)
    setShowPreview(true)
  }

  const handleDownloadPhoto = (photo: Photo) => {
    const link = document.createElement("a")
    link.href = photo.s3_url
    link.download = photo.filename
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return <div className="text-center py-8">写真を読み込み中...</div>
  }

  if (photos.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">まだ写真がアップロードされていません。</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー部分 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">アップロード済み写真 ({photos.length}枚)</h2>
        <div className="flex items-center gap-4">
          {photos.length > 0 && (
            <>
              <Button
                variant="outline"
                onClick={toggleSelectAll}
                className="flex items-center gap-2"
              >
                {selectedPhotos.size === photos.length ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                {selectedPhotos.size === photos.length ? "全選択解除" : "全選択"}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteSelected}
                disabled={selectedPhotos.size === 0}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                選択した写真を削除 ({selectedPhotos.size})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 写真グリッド */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {photos.map((photo) => (
          <Card key={photo.id} className="overflow-hidden relative">
            <CardContent className="p-0">
              {/* チェックボックス */}
              <div className="absolute top-2 left-2 z-10">
                <button
                  onClick={() => togglePhotoSelection(photo.id)}
                  className="bg-white/80 hover:bg-white rounded p-1"
                >
                  {selectedPhotos.has(photo.id) ? (
                    <CheckSquare className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Square className="h-5 w-5 text-gray-600" />
                  )}
                </button>
              </div>

              {/* 写真 */}
              <div className="relative aspect-square">
                <Image
                  src={photo.s3_url}
                  alt={photo.filename}
                  fill
                  className="object-cover cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => handlePreviewPhoto(photo)}
                />
                
                {/* アクションボタン */}
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePreviewPhoto(photo)
                    }}
                    className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownloadPhoto(photo)
                    }}
                    className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* 写真情報 */}
              <div className="p-2">
                <p className="text-xs text-gray-500 truncate">{photo.filename}</p>
                <p className="text-xs text-gray-400">
                  {new Date(photo.uploaded_at).toLocaleDateString('ja-JP')}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 写真削除確認ダイアログ */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>写真を削除</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              選択した<strong>{selectedPhotos.size}枚</strong>の写真を削除しますか？
            </p>
            <p className="text-sm text-red-600">
              ※ この操作は取り消せません。S3からも完全に削除されます。
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={confirmDeletePhotos} disabled={isDeleting}>
              {isDeleting ? "削除中..." : "削除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 写真プレビューダイアログ */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewPhoto?.filename}</DialogTitle>
          </DialogHeader>
          <div className="relative aspect-video">
            {previewPhoto && (
              <Image
                src={previewPhoto.s3_url}
                alt={previewPhoto.filename}
                fill
                className="object-contain"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              閉じる
            </Button>
            {previewPhoto && (
              <Button onClick={() => handleDownloadPhoto(previewPhoto)}>
                <Download className="h-4 w-4 mr-2" />
                ダウンロード
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 