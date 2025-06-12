"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import type { Photo } from "@/types/models"

interface PhotoGridProps {
  photos: (Photo & { url: string })[]
}

export function PhotoGrid({ photos }: PhotoGridProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<(Photo & { url: string }) | null>(null)

  const handleDownload = (photo: Photo & { url: string }) => {
    const link = document.createElement("a")
    link.href = photo.url
    link.download = photo.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">この会場にはまだ写真がありません</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="aspect-square relative overflow-hidden rounded-md cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setSelectedPhoto(photo)}
          >
            <Image
              src={photo.url || "/placeholder.svg"}
              alt={photo.filename}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>

      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        {selectedPhoto && (
          <DialogContent className="max-w-4xl">
            <div className="relative aspect-video w-full">
              <Image
                src={selectedPhoto.url || "/placeholder.svg"}
                alt={selectedPhoto.filename}
                fill
                className="object-contain"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => handleDownload(selectedPhoto)}>
                <Download className="mr-2 h-4 w-4" />
                ダウンロード
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}
