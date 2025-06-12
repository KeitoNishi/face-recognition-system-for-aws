import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/auth"
import { uploadPhotoToS3 } from "@/lib/aws"
import { createPhoto } from "@/lib/db"

async function handler(req: NextRequest) {
  if (req.method !== "POST") {
    return NextResponse.json({ message: "Method not allowed" }, { status: 405 })
  }

  try {
    const formData = await req.formData()
    const photo = formData.get("photo") as File
    const venueIdStr = formData.get("venueId") as string
    const venueId = Number.parseInt(venueIdStr)

    if (!photo) {
      return NextResponse.json({ message: "写真が必要です" }, { status: 400 })
    }

    if (isNaN(venueId)) {
      return NextResponse.json({ message: "会場IDが必要です" }, { status: 400 })
    }

    // ファイルをバッファに変換
    const bytes = await photo.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // S3にアップロード
    const timestamp = Date.now()
    const s3Key = `photos/${venueId}/${timestamp}-${photo.name}`
    await uploadPhotoToS3(buffer, s3Key, photo.type)

    // データベースに保存
    const photoRecord = await createPhoto(venueId, photo.name, s3Key)

    return NextResponse.json({ success: true, photo: photoRecord })
  } catch (error) {
    console.error("Photo upload error:", error)
    return NextResponse.json({ message: "写真のアップロード中にエラーが発生しました" }, { status: 500 })
  }
}

export const POST = withAdminAuth(handler)
