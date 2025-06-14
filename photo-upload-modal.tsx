"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Upload, X, FileImage, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Venue {
  id: number
  name: string
  isNew: boolean
}

interface PhotoUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  venue: Venue | null
  onUploadComplete: () => void
}

export function PhotoUploadModal({ open, onOpenChange, venue, onUploadComplete }: PhotoUploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList) => {
    const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"))

    if (imageFiles.length === 0) {
      setError("画像ファイルを選択してください")
      return
    }

    if (imageFiles.length > 10) {
      setError("一度にアップロードできるのは最大10枚までです")
      return
    }

    const oversizedFiles = imageFiles.filter((file) => file.size > 10 * 1024 * 1024)
    if (oversizedFiles.length > 0) {
      setError("ファイルサイズは10MB以下にしてください")
      return
    }

    setSelectedFiles(imageFiles)
    setError(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)

    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (!selectedFiles.length || !venue) return

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      selectedFiles.forEach((file) => {
        formData.append("photos", file)
      })
      formData.append("venue_id", venue.id.toString())
      formData.append("venue_name", venue.name)
      formData.append("is_new_venue", venue.isNew.toString())

      // プログレスバーのアニメーション
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 5
        })
      }, 300)

      // モック処理（実際のAPIが実装されるまで）
      await new Promise((resolve) => setTimeout(resolve, 3000))

      clearInterval(progressInterval)
      setUploadProgress(100)

      setSuccess(true)
      setTimeout(() => {
        onUploadComplete()
        resetForm()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "アップロード中にエラーが発生しました")
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
    }
  }

  const resetForm = () => {
    setSelectedFiles([])
    setError(null)
    setSuccess(false)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            写真アップロード
            {venue && (
              <Badge variant={venue.isNew ? "default" : "secondary"}>
                {venue.isNew ? "新規" : "既存"}: {venue.name}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">アップロードが完了しました</h3>
            <p className="text-gray-600">
              {selectedFiles.length}枚の写真を{venue?.name}にアップロードしました
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ファイル選択エリア */}
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300",
                selectedFiles.length > 0 ? "border-green-500 bg-green-50" : "",
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                className="hidden"
              />

              <FileImage className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div>
                <p className="text-lg font-medium mb-2">写真をアップロード</p>
                <p className="text-sm text-gray-600 mb-2">ドラッグ&ドロップまたはクリックして選択（最大10枚）</p>
                <p className="text-xs text-gray-500">JPG, PNG, GIF対応（各ファイル10MB以下）</p>
              </div>
            </div>

            {/* 選択されたファイル一覧 */}
            {selectedFiles.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">選択された写真 ({selectedFiles.length}枚)</h4>
                <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <FileImage className="h-8 w-8 text-gray-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)}MB</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(index)
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* エラー表示 */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* アップロードボタン */}
            <div className="space-y-4">
              <Button
                onClick={handleUpload}
                disabled={selectedFiles.length === 0 || isUploading}
                className="w-full h-12 text-lg"
              >
                {isUploading ? (
                  <>
                    <Upload className="h-5 w-5 mr-2 animate-spin" />
                    アップロード中...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mr-2" />
                    {selectedFiles.length}枚の写真をアップロード
                  </>
                )}
              </Button>

              {/* プログレスバー */}
              {isUploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-center text-gray-600">
                    写真をアップロード中... {uploadProgress}% ({selectedFiles.length}枚)
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
