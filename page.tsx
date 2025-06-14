"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, MapPin } from "lucide-react"
import { FaceRegistrationModal } from "@/components/face-registration-modal"

interface Venue {
  id: number
  name: string
  photoCount: number
}

export default function MainPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [showFaceRegistration, setShowFaceRegistration] = useState(false)

  useEffect(() => {
    fetchVenues()
  }, [])

  const fetchVenues = async () => {
    try {
      // 一時的にモックデータを使用
      const mockVenues = [
        { id: 1, name: "第1会場", photoCount: 25 },
        { id: 2, name: "第2会場", photoCount: 18 },
        { id: 3, name: "第3会場", photoCount: 32 },
        { id: 4, name: "第4会場", photoCount: 14 },
        { id: 5, name: "第5会場", photoCount: 21 },
        { id: 6, name: "第6会場", photoCount: 9 },
      ]

      // APIが実装されるまでの一時的な遅延
      await new Promise((resolve) => setTimeout(resolve, 500))

      setVenues(mockVenues)
    } catch (error) {
      console.error("会場データの取得に失敗しました:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold">写真管理システム</h1>
            </div>
            <Button variant="outline" onClick={() => setShowFaceRegistration(true)}>
              顔写真登録
            </Button>
          </div>
        </div>
      </header>

      {/* メインページ */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">メインページ</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">読み込み中...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {venues.map((venue) => (
                  <Link key={venue.id} href={`/venue/${venue.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-6 text-center">
                        <MapPin className="h-8 w-8 mx-auto mb-3 text-gray-600" />
                        <h3 className="font-medium mb-2">{venue.name}</h3>
                        <Badge variant="secondary">{venue.photoCount}枚</Badge>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* 顔写真登録モーダル */}
      <FaceRegistrationModal open={showFaceRegistration} onOpenChange={setShowFaceRegistration} />
    </div>
  )
}
