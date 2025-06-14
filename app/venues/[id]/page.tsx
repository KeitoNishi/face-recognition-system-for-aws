"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Download, Eye, Filter, X } from "lucide-react"
import { toast } from "sonner"

interface Photo {
  id: number
  filename: string
  s3_key: string
  s3_url?: string
  venue_id: number
  uploaded_at: string
}

interface Venue {
  id: number
  name: string
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
      const response = await fetch(`/api/venues/${venueId}`)
      if (!response.ok) throw new Error('会場データの取得に失敗しました')
      const data = await response.json()
      setVenue(data)
    } catch (error) {
      console.error("会場データの取得に失敗しました:", error)
      toast.error("会場データの取得に失敗しました")
    }
  }

  const fetchPhotos = async () => {
    try {
      const response = await fetch(`/api/venues/${venueId}/photos`)
      if (!response.ok) throw new Error('写真データの取得に失敗しました')
      const data = await response.json()
      const photosArray = Array.isArray(data.photos) ? data.photos : []
      setPhotos(photosArray)
      setFilteredPhotos(photosArray)
    } catch (error) {
      console.error("写真データの取得に失敗しました:", error)
      toast.error("写真データの取得に失敗しました")
      setPhotos([])
      setFilteredPhotos([])
    } finally {
      setLoading(false)
    }
  }

  const checkFaceRegistration = async () => {
    try {
      const response = await fetch('/api/faces/current')
      if (response.ok) {
        const data = await response.json()
        setHasRegisteredFace(data.hasRegisteredFace || false)
      } else {
        setHasRegisteredFace(false)
      }
    } catch (error) {
      console.error("顔写真登録状態の確認に失敗しました:", error)
      setHasRegisteredFace(false)
    }
  }

  const handleFilterPhotos = async () => {
    if (!hasRegisteredFace) {
      toast.error("顔写真を登録してください")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/photos/filter?venue_id=${venueId}`)
      if (!response.ok) throw new Error('写真の絞り込みに失敗しました')
      const data = await response.json()
      const filteredArray = Array.isArray(data) ? data : []
      setFilteredPhotos(filteredArray)
      setIsFiltered(true)
      toast.success(`${filteredArray.length}枚の写真が見つかりました`)
    } catch (error) {
      console.error("写真の絞り込みに失敗しました:", error)
      toast.error("写真の絞り込みに失敗しました")
      setFilteredPhotos([])
    } finally {
      setLoading(false)
    }
  }

  const clearFilter = () => {
    setFilteredPhotos(photos)
    setIsFiltered(false)
    toast.success("すべての写真を表示しています")
  }

  const handleDownload = async (photo: Photo) => {
    try {
      const response = await fetch(`/api/photos/${photo.id}/download`)
      if (!response.ok) throw new Error('ダウンロードに失敗しました')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = photo.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success("写真をダウンロードしました")
    } catch (error) {
      console.error("ダウンロードに失敗しました:", error)
      toast.error("ダウンロードに失敗しました")
    }
  }

  const getPhotoUrl = (photo: Photo) => {
    return `/api/photos/${photo.id}/thumbnail`
  }

  const getFullPhotoUrl = (photo: Photo) => {
    return `/api/photos/${photo.id}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => router.push('/venues')} className="hover:bg-white/20">
                <ArrowLeft className="h-4 w-4 mr-2" />
                戻る
              </Button>
              <h1 className="text-xl font-bold text-gray-900">{venue?.name}</h1>
            </div>
            {hasRegisteredFace && (
              <div className="flex gap-2">
                {!isFiltered ? (
                  <Button 
                    onClick={handleFilterPhotos} 
                    disabled={loading} 
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    写真を絞り込む
                  </Button>
                ) : (
                  <Button variant="outline" onClick={clearFilter} className="bg-white/50 hover:bg-white/80">
                    <X className="h-4 w-4 mr-2" />
                    すべて表示
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 写真一覧 */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl text-gray-900">{venue?.name}</CardTitle>
              <Badge 
                variant="outline" 
                className="bg-blue-100 text-blue-800 border-blue-200"
              >
                {isFiltered ? `${filteredPhotos.length}件の絞り込み結果` : `${photos.length}枚の写真`}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">読み込み中...</span>
              </div>
            ) : filteredPhotos.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  {isFiltered ? "📷" : "📁"}
                </div>
                <p className="text-gray-500 mb-2">
                  {isFiltered ? "絞り込み結果が見つかりませんでした" : "写真がありません"}
                </p>
                <p className="text-sm text-gray-400">
                  {isFiltered ? "別の条件で検索してみてください" : "管理者が写真をアップロードするまでお待ちください"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredPhotos.map((photo) => (
                  <Card key={photo.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group bg-white/90 hover:bg-white border-0 shadow-md hover:scale-105">
                    <div className="relative aspect-square">
                      <Image
                        src={getPhotoUrl(photo)}
                        alt={photo.filename}
                        fill
                        className="object-cover cursor-pointer"
                        onClick={() => setSelectedPhoto(photo)}
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedPhoto(photo)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownload(photo)
                          }}
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
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>{selectedPhoto?.filename}</DialogTitle>
          </DialogHeader>
          <div className="relative aspect-video max-h-[70vh] overflow-hidden">
            {selectedPhoto && (
              <Image
                src={getFullPhotoUrl(selectedPhoto)}
                alt={selectedPhoto.filename}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 1024px"
              />
            )}
          </div>
          <div className="p-6 pt-0 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              アップロード日: {selectedPhoto && new Date(selectedPhoto.uploaded_at).toLocaleDateString("ja-JP")}
            </p>
            <Button onClick={() => selectedPhoto && handleDownload(selectedPhoto)}>
              <Download className="h-4 w-4 mr-2" />
              ダウンロード
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
