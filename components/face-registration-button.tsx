"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Camera } from "lucide-react"

export function FaceRegistrationButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)

      // プレビュー表示
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("face", file)

      const response = await fetch("/api/faces/register", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("顔の登録に失敗しました")
      }

      toast({
        title: "顔写真を登録しました",
        description: "写真の絞り込みに使用されます",
      })

      setOpen(false)
      setFile(null)
      setPreview(null)
    } catch (error) {
      console.error(error)
      toast({
        title: "エラーが発生しました",
        description: error instanceof Error ? error.message : "顔の登録に失敗しました",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Camera className="mr-2 h-4 w-4" />
        顔写真登録
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>顔写真の登録</DialogTitle>
            <DialogDescription>あなたが写っている写真を絞り込むために、顔写真を登録してください。</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="face">顔写真</Label>
              <Input id="face" type="file" accept="image/*" onChange={handleFileChange} required />
            </div>

            {preview && (
              <div className="mt-4 flex justify-center">
                <img src={preview || "/placeholder.svg"} alt="プレビュー" className="max-h-64 rounded-md" />
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                キャンセル
              </Button>
              <Button type="submit" disabled={!file || loading}>
                {loading ? "登録中..." : "登録する"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
