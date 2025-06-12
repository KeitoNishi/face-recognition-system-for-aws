"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Upload } from "lucide-react"

interface PhotoUploaderProps {
  venueId: number
}

export function PhotoUploader({ venueId }: PhotoUploaderProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [completed, setCompleted] = useState(0)
  const [total, setTotal] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files)
      setFiles(selectedFiles)
    }
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    setProgress(0)
    setCompleted(0)
    setTotal(files.length)

    try {
      let successCount = 0

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append("photo", file)
        formData.append("venueId", venueId.toString())

        const response = await fetch("/api/admin/photos/upload", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          successCount++
        }

        setCompleted(i + 1)
        setProgress(Math.round(((i + 1) / files.length) * 100))
      }

      toast({
        title: "アップロード完了",
        description: `${successCount}/${files.length}枚の写真をアップロードしました`,
      })

      // アップロード完了ページにリダイレクト
      router.push(`/admin/venues/${venueId}/photos/upload-complete`)
    } catch (error) {
      console.error(error)
      toast({
        title: "エラーが発生しました",
        description: "写真のアップロード中にエラーが発生しました",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>写真アップロード</CardTitle>
        <CardDescription>この会場に写真をアップロードします。複数の写真を一度に選択できます。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center w-full">
          <label
            htmlFor="photo-upload"
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-8 h-8 mb-2 text-gray-500" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">クリックして写真を選択</span>
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, GIF (最大10MB)</p>
            </div>
            <input
              id="photo-upload"
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              ref={fileInputRef}
              disabled={uploading}
            />
          </label>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{files.length}枚の写真が選択されています</p>

            {uploading && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground text-right">
                  {completed}/{total} 完了 ({progress}%)
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleUpload} disabled={files.length === 0 || uploading} className="w-full">
          {uploading ? "アップロード中..." : "アップロード開始"}
        </Button>
      </CardFooter>
    </Card>
  )
}
