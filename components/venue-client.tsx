"use client"

import { useState } from "react"
import { UserHeader } from "@/components/user-header"
import { PhotoGrid } from "@/components/photo-grid"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Search, ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { Photo } from "@/types/models"

interface VenueClientProps {
  venue: any
  venueId: number
  initialPhotos: (Photo & { url: string })[]
}

export function VenueClient({ venue, venueId, initialPhotos }: VenueClientProps) {
  const [photos, setPhotos] = useState(initialPhotos)
  const [isFiltered, setIsFiltered] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleFilter = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/photos/filter?venueId=${venueId}`, {
        method: "GET",
      })

      if (!response.ok) {
        throw new Error("写真の絞り込みに失敗しました")
      }

      const data = await response.json()
      setPhotos(data.photos)
      setIsFiltered(true)

      if (data.photos.length === 0) {
        toast({
          title: "該当する写真がありません",
          description: "あなたが写っている写真は見つかりませんでした",
        })
      } else {
        toast({
          title: "絞り込み完了",
          description: `${data.photos.length}枚の写真が見つかりました`,
        })
      }
    } catch (error) {
      console.error(error)
      toast({
        title: "エラーが発生しました",
        description: error instanceof Error ? error.message : "写真の絞り込みに失敗しました",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const clearFilter = () => {
    setPhotos(initialPhotos)
    setIsFiltered(false)
    toast({
      title: "絞り込み解除",
      description: "すべての写真を表示しています",
    })
  }

  return (
    <div className="container mx-auto py-6">
      <UserHeader />
      
      {/* パンくずナビ */}
      <div className="mb-4">
        <Link 
          href="/venues" 
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          戻る
        </Link>
      </div>

      {/* ヘッダー部分 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{venue.name}</h1>
          <p className="text-gray-600 mt-1">
            {isFiltered ? `${photos.length}枚の写真（絞り込み中）` : `${photos.length}枚の写真`}
          </p>
        </div>
        
        {/* 絞り込みボタン */}
        <div className="flex gap-2">
          {isFiltered ? (
            <Button variant="outline" onClick={clearFilter}>
              すべて表示
            </Button>
          ) : (
            <Button onClick={handleFilter} disabled={loading}>
              <Search className="mr-2 h-4 w-4" />
              {loading ? "絞り込み中..." : "写真を絞り込む"}
            </Button>
          )}
        </div>
      </div>

      {/* 写真グリッド */}
      <PhotoGrid photos={photos} />
    </div>
  )
} 