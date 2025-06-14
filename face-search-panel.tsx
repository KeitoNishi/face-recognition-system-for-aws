"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, X, User, AlertCircle, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Photo {
  id: number
  filename: string
  s3_key: string
  venue_id: number
  uploaded_at: string
}

interface FaceSearchPanelProps {
  venueId: number
  onSearchResults: (results: Photo[]) => void
  onClearSearch: () => void
  isSearchActive: boolean
}

export function FaceSearchPanel({ venueId, onSearchResults, onClearSearch, isSearchActive }: FaceSearchPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [searchProgress, setSearchProgress] = useState(0)
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

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleSearch = async () => {
    if (!selectedFile) return

    setIsSearching(true)
    setSearchProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("face_image", selectedFile)
      formData.append("venue_id", venueId.toString())

      // プログレスバーのアニメーション
      const progressInterval = setInterval(() => {
        setSearchProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch("/api/face-search", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setSearchProgress(100)

      if (!response.ok) {
        throw new Error("検索に失敗しました")
      }

      const results = await response.json()
      onSearchResults(results)

      setTimeout(() => {
        setSearchProgress(0)
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "検索中にエラーが発生しました")
      setSearchProgress(0)
    } finally {
      setIsSearching(false)
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
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInputChange} className="hidden" />

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
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 検索ボタン */}
      <div className="space-y-3">
        <Button onClick={handleSearch} disabled={!selectedFile || isSearching} className="w-full" size="lg">
          {isSearching ? (
            <>
              <Search className="h-4 w-4 mr-2 animate-spin" />
              検索中...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              顔認識検索を開始
            </>
          )}
        </Button>

        {/* プログレスバー */}
        {isSearching && (
          <div className="space-y-2">
            <Progress value={searchProgress} className="w-full" />
            <p className="text-xs text-center text-muted-foreground">AI顔認識処理中... {searchProgress}%</p>
          </div>
        )}

        {/* 検索状態表示 */}
        {isSearchActive && (
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">検索結果を表示中</span>
            </div>
            <Button variant="outline" size="sm" onClick={onClearSearch}>
              クリア
            </Button>
          </div>
        )}
      </div>

      {/* 使用方法のヒント */}
      <Card>
        <CardContent className="p-4">
          <h4 className="text-sm font-medium mb-2">💡 検索のコツ</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• 顔がはっきり写っている写真を使用してください</li>
            <li>• 正面を向いた写真が最も効果的です</li>
            <li>• 明るく鮮明な画像をお選びください</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
