"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Download, Eye } from "lucide-react"

interface Photo {
  id: number
  filename: string
  s3_key: string
  venue_id: number
  uploaded_at: string
}

interface Venue {
  id: number
  name: string
  photoCount: number
}

export default function VenuePage() {
  const params = useParams()
  const router = useRouter()
  const venueId = Number(params.id)

  const [venue, setVenue] = useState<Venue | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [isFiltered, setIsFiltered] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [hasRegisteredFace, setHasRegisteredFace] = useState(false)

  useEffect(() => {
    fetchVenueData()
    fetchPhotos()
    checkFaceRegistration()
  }, [venueId])

  const fetchVenueData = async () => {
    try {
      // モックデータ
      const mockVenues = [
        { id: 1, name: "第1会場", photoCount: 25 },
        { id: 2, name: "第2会場", photoCount: 18 },
        { id: 3, name: "第3会場", photoCount: 32 },
        { id: 4, name: "第4会場", photoCount: 14 },
        { id: 5, name: "第5会場", photoCount: 21 },
        { id: 6, name: "第6会場", photoCount: 9 },
      ]

      const venueData = mockVenues.find((v) => v.id === venueId)
      setVenue(venueData || null)
    } catch (error) {
      console.error("会場データの取得に失敗しました:", error)
    }
  }

  const fetchPhotos = async () => {
    try {
      // モック写真データ
      const mockPhotos = Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        filename: `photo_${String(i + 1).padStart(3, "0")}.jpg`,
        s3_key: `venue_${venueId}/photo_${String(i + 1).padStart(3, "0")}.jpg`,
        venue_id: venueId,
        uploaded_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      }))

      await new Promise((resolve) => setTimeout(resolve, 500))

      setPhotos(mockPhotos)
      setFilteredPhotos(mockPhotos)
    } catch (error) {
      console.error("写真データの取得に失敗しました:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkFaceRegistration = async () => {
    try {
      // 一時的にfalseを返す
      setHasRegisteredFace(false)
    } catch (error) {
      console.error("顔写真登録状態の確認に失敗しました:", error)
    }
  }

  const handleFilterPhotos = async () => {
    if (!hasRegisteredFace) return

    setLoading(true)
    try {
      // モック絞り込み結果（最初の3枚のみ）
      const filteredResults = photos.slice(0, 3)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setFilteredPhotos(filteredResults)
      setIsFiltered(true)
    } catch (error) {
      console.error("写真の絞り込みに失敗しました:", error)
    } finally {
      setLoading(false)
    }
  }

  const clearFilter = () => {
    setFilteredPhotos(photos)
    setIsFiltered(false)
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                戻る
              </Button>
              <h1 className="text-xl font-bold">{venue?.name}</h1>
            </div>
            {hasRegisteredFace && (
              <div className="flex gap-2">
                {!isFiltered ? (
                  <Button onClick={handleFilterPhotos} disabled={loading} className="bg-green-600 hover:bg-green-700">
                    写真を絞り込む
                  </Button>
                ) : (
                  <Button variant="outline" onClick={clearFilter}>
                    すべて表示
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 写真一覧 */}
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{venue?.name}</CardTitle>
              <Badge variant="outline">
                {isFiltered ? `${filteredPhotos.length}件の絞り込み結果` : `${photos.length}枚の写真`}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">読み込み中...</div>
            ) : filteredPhotos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {isFiltered ? "絞り込み結果が見つかりませんでした" : "写真がありません"}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredPhotos.map((photo) => (
                  <Card key={photo.id} className="overflow-hidden hover:shadow-md transition-shadow group">
                    <div className="relative aspect-square">
                      <Image
                        src={`/placeholder.svg?height=300&width=300&text=Photo${photo.id}`}
                        alt={photo.filename}
                        fill
                        className="object-cover cursor-pointer"
                        onClick={() => setSelectedPhoto(photo)}
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0"
                          onClick={() => setSelectedPhoto(photo)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0"
                          onClick={() => handleDownload(photo)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* 写真拡大モーダル */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
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
                src={`/placeholder.svg?height=600&width=800&text=Photo${selectedPhoto.id}`}
                alt={selectedPhoto.filename}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
