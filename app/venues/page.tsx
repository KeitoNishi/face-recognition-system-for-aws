"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Camera, MapPin, LogOut } from "lucide-react"
import { FaceRegistrationModal } from "@/components/face-registration-modal"
import { toast } from "sonner"

interface Venue {
  id: number
  name: string
  photoCount?: number
}

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [showFaceRegistration, setShowFaceRegistration] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchVenues()
  }, [])

  const fetchVenues = async () => {
    try {
      const response = await fetch('/api/venues')
      if (!response.ok) {
        throw new Error('会場データの取得に失敗しました')
      }
      const data = await response.json()
      
      // 各会場の写真数を取得
      const venuesWithCount = await Promise.all(
        data.map(async (venue: Venue) => {
          try {
            const countResponse = await fetch(`/api/venues/${venue.id}/photos/count`)
            if (countResponse.ok) {
              const countData = await countResponse.json()
              return { ...venue, photoCount: countData.count }
            }
          } catch (error) {
            console.error(`写真数取得エラー (会場ID: ${venue.id}):`, error)
          }
          return venue
        })
      )
      
      setVenues(venuesWithCount)
    } catch (error) {
      console.error("会場データの取得に失敗しました:", error)
      toast.error("会場データの取得に失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })
      
      if (response.ok) {
        router.push('/')
      } else {
        throw new Error('ログアウトに失敗しました')
      }
    } catch (error) {
      console.error("ログアウトに失敗しました:", error)
      toast.error("ログアウトに失敗しました")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-white/20 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">写真管理システム</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowFaceRegistration(true)}
                className="bg-white/50 hover:bg-white/80"
              >
                顔写真登録
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                className="hover:bg-white/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                ログアウト
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">会場一覧</h2>
          <p className="text-gray-600">写真を管理したい会場を選択してください</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">読み込み中...</span>
          </div>
        ) : venues.length === 0 ? (
          <Card className="max-w-md mx-auto bg-white/80 backdrop-blur-sm">
            <CardContent className="text-center py-12">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">利用可能な会場がありません</p>
              <p className="text-sm text-gray-400">管理者にお問い合わせください</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venues.map((venue) => (
              <Link key={venue.id} href={`/venues/${venue.id}`}>
                <Card className="group hover:shadow-xl transition-all duration-300 bg-white/80 backdrop-blur-sm hover:bg-white/90 hover:scale-105 cursor-pointer border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="text-center space-y-4">
                      <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full w-16 h-16 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <MapPin className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {venue.name}
                        </h3>
                        {venue.photoCount !== undefined && (
                          <Badge 
                            variant="secondary" 
                            className="bg-blue-100 text-blue-800 hover:bg-blue-200"
                          >
                            {venue.photoCount}枚
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* 顔写真登録モーダル */}
      <FaceRegistrationModal 
        open={showFaceRegistration} 
        onOpenChange={setShowFaceRegistration} 
      />
    </div>
  )
}
