import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/auth"
import { query } from "@/lib/db"
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3"

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-northeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

async function handler(req: NextRequest, { params }: { params: { id: string } }) {
  const photoId = Number.parseInt(params.id)

  if (isNaN(photoId)) {
    return NextResponse.json({ message: "無効な写真IDです" }, { status: 400 })
  }

  if (req.method === "DELETE") {
    try {
      // 写真情報を取得
      const photoResult = await query("SELECT * FROM photos WHERE id = $1", [photoId])
      
      if (photoResult.rows.length === 0) {
        return NextResponse.json({ message: "写真が見つかりません" }, { status: 404 })
      }

      const photo = photoResult.rows[0]

      // S3から写真を削除
      try {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: photo.s3_key,
        })
        await s3Client.send(deleteCommand)
      } catch (s3Error) {
        console.error("S3 delete error:", s3Error)
        // S3削除に失敗してもデータベースからは削除する
      }

      // データベースから写真レコードを削除
      await query("DELETE FROM photos WHERE id = $1", [photoId])

      return NextResponse.json({ 
        message: "写真を削除しました",
        photo: photo
      })
    } catch (error) {
      console.error("Delete photo error:", error)
      return NextResponse.json({ message: "写真の削除中にエラーが発生しました" }, { status: 500 })
    }
  }

  return NextResponse.json({ message: "Method not allowed" }, { status: 405 })
}

export const DELETE = withAdminAuth(handler) 