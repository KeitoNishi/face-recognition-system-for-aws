"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Upload, User, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface FaceRegistrationProps {
  hasRegisteredFace: boolean
  onFaceRegistered: () => void
}

export function FaceRegistration({ hasRegisteredFace, onFaceRegistered }: FaceRegistrationProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("ファイルサイズは10MB以下にしてください")
      return
    }

    setSelectedFile(file)
    setError(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
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

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("face_image", selectedFile)

      // プログレスバーのアニメーション
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch("/api/face-registration", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        throw new Error("顔写真の登録に失敗しました")
      }

      onFaceRegistered()
      setSelectedFile(null)
      setPreviewUrl(null)

      setTimeout(() => {
        setUploadProgress(0)
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "登録中にエラーが発生しました")
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
    }
  }

  const clearSelection = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  if (hasRegisteredFace) {
    return <div></div>
  }

  return (
    <div className="space-y-4">
      {/* ファイル選択エリア */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          selectedFile ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "",
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
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          className="hidden"
        />

        {previewUrl ? (
          <div className="space-y-4">
            <div className="relative w-24 h-24 mx-auto">
              <img
                src={previewUrl || "/placeholder.svg"}
                alt="選択された画像"
                className="w-full h-full object-cover rounded-lg"
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  clearSelection()
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">{selectedFile?.name}</p>
              <p className="text-xs text-muted-foreground">
                {selectedFile && (selectedFile.size / 1024 / 1024).toFixed(2)}MB
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <User className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <p className="text-sm font-medium">顔写真をアップロード</p>
              <p className="text-xs text-muted-foreground">ドラッグ&ドロップまたはクリックして選択</p>
            </div>
          </div>
        )}
      </div>

      {/* エラー表示 */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* アップロードボタン */}
      <div className="space-y-3">
        <Button onClick={handleUpload} disabled={!selectedFile || isUploading} className="w-full" size="lg">
          {isUploading ? (
            <>
              <Upload className="h-4 w-4 mr-2 animate-spin" />
              登録中...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              顔写真を登録
            </>
          )}
        </Button>

        {/* プログレスバー */}
        {isUploading && (
          <div className="space-y-2">
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-xs text-center text-muted-foreground">顔写真を登録中... {uploadProgress}%</p>
          </div>
        )}
      </div>

      {/* 注意事項 */}
      <Alert>
        <AlertDescription className="text-xs">
          <strong>💡 登録のコツ:</strong> 顔がはっきり写っている正面向きの写真を使用してください。
          一度登録すると、その顔で写真の絞り込みができるようになります。
        </AlertDescription>
      </Alert>
    </div>
  )
}
