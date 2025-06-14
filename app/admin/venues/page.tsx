"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Settings, LogOut, MapPin, Plus } from "lucide-react"

interface Venue {
  id: number
  name: string
  photo_count?: number
}

async function getVenuesWithCounts(): Promise<Venue[]> {
  const response = await fetch("/api/venues", { cache: "no-store" })
  if (!response.ok) throw new Error("Failed to fetch venues")
  const venues = await response.json()
  
  // 各会場の写真数を取得
  const venuesWithCounts = await Promise.all(
    venues.map(async (venue: Venue) => {
      try {
        const countResponse = await fetch(`/api/venues/${venue.id}/photos/count`, { cache: "no-store" })
        const countData = await countResponse.json()
        return { ...venue, photo_count: countData.count || 0 }
      } catch {
        return { ...venue, photo_count: 0 }
      }
    })
  )
  
  return venuesWithCounts
}

function VenuesList() {
  const [venues, setVenues] = useState<Venue[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewVenueDialog, setShowNewVenueDialog] = useState(false)
  const [newVenueName, setNewVenueName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    getVenuesWithCounts()
      .then(setVenues)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/admin")
  }

  const handleVenueSelect = (venueId: number) => {
    router.push(`/admin/venues/${venueId}/photos`)
  }

  const handleNewVenue = () => {
    setShowNewVenueDialog(true)
  }

  const handleCreateVenue = async () => {
    if (!newVenueName.trim()) {
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch("/api/admin/venues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newVenueName.trim() }),
      })

      if (response.ok) {
        // 会場リストを再読み込み
        const updatedVenues = await getVenuesWithCounts()
        setVenues(updatedVenues)
        setShowNewVenueDialog(false)
        setNewVenueName("")
        alert(`会場「${newVenueName}」を追加しました`)
      } else {
        const errorData = await response.json()
        alert(`エラー: ${errorData.message || "会場の追加に失敗しました"}`)
      }
    } catch (error) {
      console.error("会場追加エラー:", error)
      alert("会場の追加中にエラーが発生しました")
    } finally {
      setIsCreating(false)
    }
  }

  const handleCancelNewVenue = () => {
    setShowNewVenueDialog(false)
    setNewVenueName("")
  }



  if (loading) {
    return <div className="flex justify-center py-8">会場情報を読み込み中...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-red-500" />
            <h1 className="text-xl font-semibold">管理画面</h1>
          </div>
          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <LogOut className="h-5 w-5" />
              <span>ログアウト</span>
            </button>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="container mx-auto px-6 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">管理画面</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* 既存の会場を選択 */}
            <div>
              <h2 className="text-lg font-semibold mb-4">会場を選択</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {venues.map((venue) => (
                  <div 
                    key={venue.id} 
                    className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleVenueSelect(venue.id)}
                  >
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <div className="flex-1">
                      <span className="font-medium text-lg">{venue.name}</span>
                      <p className="text-sm text-gray-500">{venue.photo_count}枚の写真</p>
                    </div>
                    <div className="text-gray-400">
                      →
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 新規会場を登録 */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">新規会場を登録</h2>
              <Button
                onClick={handleNewVenue}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                新規登録
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 新規会場追加ダイアログ */}
      <Dialog open={showNewVenueDialog} onOpenChange={setShowNewVenueDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新規会場を追加</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="venue-name">会場名</Label>
              <Input
                id="venue-name"
                value={newVenueName}
                onChange={(e) => setNewVenueName(e.target.value)}
                placeholder="会場名を入力してください"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isCreating) {
                    handleCreateVenue()
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelNewVenue} disabled={isCreating}>
              キャンセル
            </Button>
            <Button onClick={handleCreateVenue} disabled={!newVenueName.trim() || isCreating}>
              {isCreating ? "追加中..." : "追加"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


    </div>
  )
}

export default function AdminVenuesPage() {
  return <VenuesList />
}
