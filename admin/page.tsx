"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, Upload, Plus, LogOut, MapPin } from "lucide-react"
import { PhotoUploadModal } from "@/components/photo-upload-modal"

interface Venue {
  id: number
  name: string
  photoCount: number
}

export default function AdminPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [selectedVenue, setSelectedVenue] = useState<string>("")
  const [newVenueName, setNewVenueName] = useState("")
  const [showNewVenueInput, setShowNewVenueInput] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    fetchVenues()
  }, [])

  const fetchVenues = async () => {
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

      await new Promise((resolve) => setTimeout(resolve, 500))
      setVenues(mockVenues)
    } catch (error) {
      console.error("会場データの取得に失敗しました:", error)
      setError("会場データの取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = () => {
    if (!selectedVenue && !newVenueName.trim()) {
      setError("会場を選択するか、新規会場名を入力してください")
      return
    }

    setError("")
    setShowUploadModal(true)
  }

  const handleLogout = () => {
    router.push("/admin/login")
  }

  const handleUploadComplete = () => {
    setShowUploadModal(false)
    setSelectedVenue("")
    setNewVenueName("")
    setShowNewVenueInput(false)
    fetchVenues() // 会場リストを更新
  }

  const getSelectedVenueData = () => {
    if (newVenueName.trim()) {
      return { id: 0, name: newVenueName.trim(), isNew: true }
    }
    const venue = venues.find((v) => v.id.toString() === selectedVenue)
    return venue ? { ...venue, isNew: false } : null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-red-600" />
              <h1 className="text-xl font-bold">管理画面</h1>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              ログアウト
            </Button>
          </div>
        </div>
      </header>

      {/* メイン画面 */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">管理画面</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="text-center py-8">読み込み中...</div>
            ) : (
              <>
                {/* 既存会場選択 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">既存の会場を選択</h3>
                  <RadioGroup value={selectedVenue} onValueChange={setSelectedVenue}>
                    <div className="grid grid-cols-2 gap-3">
                      {venues.map((venue) => (
                        <div key={venue.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={venue.id.toString()} id={`venue-${venue.id}`} />
                          <Label htmlFor={`venue-${venue.id}`} className="flex items-center gap-2 cursor-pointer">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span>{venue.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {venue.photoCount}枚
                            </Badge>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                {/* 区切り線 */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">または</span>
                  </div>
                </div>

                {/* 新規会場登録 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">新規会場を登録</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowNewVenueInput(!showNewVenueInput)
                        if (!showNewVenueInput) {
                          setSelectedVenue("") // 既存選択をクリア
                        }
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      新規登録
                    </Button>
                  </div>

                  {showNewVenueInput && (
                    <div className="space-y-2">
                      <Label htmlFor="newVenue">新規会場名</Label>
                      <Input
                        id="newVenue"
                        type="text"
                        value={newVenueName}
                        onChange={(e) => {
                          setNewVenueName(e.target.value)
                          if (e.target.value.trim()) {
                            setSelectedVenue("") // 既存選択をクリア
                          }
                        }}
                        placeholder="例: 第7会場"
                        className="w-full"
                      />
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
                <Button onClick={handleUpload} className="w-full h-12 text-lg bg-green-600 hover:bg-green-700">
                  <Upload className="h-5 w-5 mr-2" />
                  アップロード
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </main>

      {/* 写真アップロードモーダル */}
      <PhotoUploadModal
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        venue={getSelectedVenueData()}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  )
}
