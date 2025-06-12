"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Search } from "lucide-react"
import type { Photo } from "@/types/models"
import { PhotoGrid } from "./photo-grid"

interface FaceFilterButtonProps {
  venueId: number
}

export function FaceFilterButton({ venueId }: FaceFilterButtonProps) {
  const [loading, setLoading] = useState(false)
  const [filteredPhotos, setFilteredPhotos] = useState<(Photo & { url: string })[] | null>(null)
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
      setFilteredPhotos(data.photos)

      if (data.photos.length === 0) {
        toast({
          title: "該当する写真がありません",
          description: "あなたが写っている写真は見つかりませんでした",
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
    setFilteredPhotos(null)
  }

  return (
    <div>
      {filteredPhotos ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">あなたが写っている写真 ({filteredPhotos.length}枚)</h2>
            <Button variant="outline" onClick={clearFilter}>
              絞り込みを解除
            </Button>
          </div>
          <PhotoGrid photos={filteredPhotos} />
        </div>
      ) : (
        <Button onClick={handleFilter} disabled={loading}>
          <Search className="mr-2 h-4 w-4" />
          {loading ? "絞り込み中..." : "写真を絞り込む"}
        </Button>
      )}
    </div>
  )
}
