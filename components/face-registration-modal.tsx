"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Upload, User, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface FaceRegistrationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FaceRegistrationModal({ open, onOpenChange }: FaceRegistrationModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
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

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('face_image', selectedFile)

      // プログレス更新
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch('/api/face-registration', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '顔写真の登録に失敗しました')
      }

      const result = await response.json()
      setSuccess(true)
      toast.success('顔写真の登録が完了しました！')
      
      setTimeout(() => {
        onOpenChange(false)
        resetForm()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "登録中にエラーが発生しました")
      setUploadProgress(0)
      toast.error('顔写真の登録に失敗しました')
    } finally {
      setIsUploading(false)
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setError(null)
    setSuccess(false)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>顔写真登録</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="text-center py-8">
            <div className="text-green-600 text-4xl mb-4">✓</div>
            <p className="font-medium">顔写真の登録が完了しました！</p>
            <p className="text-sm text-gray-600 mt-2">写真の絞り込み機能が利用できます</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* ファイル選択エリア */}
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
                selectedFile ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-gray-400",
              )}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
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
                      src={previewUrl}
                      alt="選択された画像"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        resetForm()
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm font-medium">{selectedFile?.name}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <User className="h-12 w-12 text-gray-400 mx-auto" />
                  <div>
                    <p className="text-sm font-medium">顔写真をアップロード</p>
                    <p className="text-xs text-gray-500">クリックまたはドラッグ&ドロップで選択</p>
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
              <Button onClick={handleUpload} disabled={!selectedFile || isUploading} className="w-full">
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
                  <p className="text-xs text-center text-gray-500">登録中... {uploadProgress}%</p>
                </div>
              )}
            </div>

            {/* 注意事項 */}
            <Alert>
              <AlertDescription className="text-xs">
                <strong>💡 登録のコツ:</strong> 顔がはっきり写っている正面向きの写真を使用してください。
                登録すると、写真の絞り込みができるようになります。
              </AlertDescription>
            </Alert>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 