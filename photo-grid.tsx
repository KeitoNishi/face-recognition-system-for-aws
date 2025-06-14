"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Download, Eye, Calendar, FileImage } from "lucide-react"
import { cn } from "@/lib/utils"

interface Photo {
  id: number
  filename: string
  s3_key: string
  venue_id: number
  uploaded_at: string
}

interface PhotoGridProps {
  photos: Photo[]
  loading: boolean
  searchActive: boolean
}

export function PhotoGrid({ photos, loading, searchActive }: PhotoGridProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [imageLoading, setImageLoading] = useState<{ [key: number]: boolean }>({})

  const handleDownload = async (photo: Photo) => {
    try {
      const response = await fetch(`/api/photos/${photo.id}/download`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = photo.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("ダウンロードに失敗しました:", error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="photo-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="aspect-square w-full" />
            <CardContent className="p-4">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <FileImage className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {searchActive ? "検索結果が見つかりませんでした" : "写真がありません"}
        </h3>
        <p className="text-muted-foreground">
          {searchActive ? "別の顔写真で検索してみてください" : "この会場にはまだ写真がアップロードされていません"}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="photo-grid">
        {photos.map((photo, index) => (
          <Card
            key={photo.id}
            className={cn("photo-card overflow-hidden cursor-pointer group", "animate-fade-in")}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="relative aspect-square overflow-hidden">
              <Image
                src={`/api/photos/${photo.id}/thumbnail`}
                alt={photo.filename}
                fill
                className={cn(
                  "object-cover transition-all duration-300 group-hover:scale-105",
                  imageLoading[photo.id] ? "blur-sm" : "blur-0",
                )}
                onLoadStart={() => setImageLoading((prev) => ({ ...prev, [photo.id]: true }))}
                onLoad={() => setImageLoading((prev) => ({ ...prev, [photo.id]: false }))}
                sizes="(max-width: 640px) 200px, (max-width: 1024px) 280px, 320px"
              />

              {/* オーバーレイ */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />

              {/* アクションボタン */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                </Dialog>

                <Button
                  size="sm"
                  variant="secondary"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDownload(photo)
                  }}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>

              {searchActive && (
                <Badge className="absolute bottom-2 left-2 bg-green-500 hover:bg-green-600">検索結果</Badge>
              )}
            </div>

            <CardContent className="p-4">
              <h3 className="font-medium text-sm truncate mb-2">{photo.filename}</h3>
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(photo.uploaded_at)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 写真詳細モーダル */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedPhoto?.filename}</span>
              <Button variant="outline" size="sm" onClick={() => selectedPhoto && handleDownload(selectedPhoto)}>
                <Download className="h-4 w-4 mr-2" />
                ダウンロード
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedPhoto && (
            <div className="relative w-full h-[70vh]">
              <Image
                src={`/api/photos/${selectedPhoto.id}/full`}
                alt={selectedPhoto.filename}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 1024px"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
