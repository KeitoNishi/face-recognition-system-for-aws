"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Trash2 } from "lucide-react"

interface VenueDeleteButtonProps {
  venueId: number
  venueName: string
}

export function VenueDeleteButton({ venueId, venueName }: VenueDeleteButtonProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDeleteVenue = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/admin/venues/${venueId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (response.ok) {
        alert("会場を削除しました")
        router.push("/admin/venues")
      } else {
        alert(`エラー: ${data.message || "会場の削除に失敗しました"}`)
      }
    } catch (error) {
      console.error("会場削除エラー:", error)
      alert("会場の削除中にエラーが発生しました")
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setShowDeleteDialog(true)}
        className="flex items-center gap-2"
      >
        <Trash2 className="h-4 w-4" />
        会場を削除
      </Button>

      {/* 会場削除確認ダイアログ */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>会場を削除</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              会場「<strong>{venueName}</strong>」を削除しますか？
            </p>
            <p className="text-sm text-red-600">
              ※ この操作は取り消せません。会場内のすべての写真も削除されます。
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleDeleteVenue} disabled={isDeleting}>
              {isDeleting ? "削除中..." : "削除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 