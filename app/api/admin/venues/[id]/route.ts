import { type NextRequest, NextResponse } from "next/server"
import { withAdminAuth } from "@/lib/auth"
import { query } from "@/lib/db"

async function handler(req: NextRequest, { params }: { params: { id: string } }) {
  const venueId = Number.parseInt(params.id)

  if (isNaN(venueId)) {
    return NextResponse.json({ message: "無効な会場IDです" }, { status: 400 })
  }

  if (req.method === "DELETE") {
    try {
      // 会場に関連する写真を取得
      const photosResult = await query("SELECT * FROM photos WHERE venue_id = $1", [venueId])
      const photos = photosResult.rows

      // S3から写真を削除
      if (photos.length > 0) {
        const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3")
        
        const s3Client = new S3Client({
          region: process.env.AWS_REGION || "ap-northeast-1",
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          },
        })

        // 各写真をS3から削除
        for (const photo of photos) {
          try {
            const deleteCommand = new DeleteObjectCommand({
              Bucket: process.env.S3_BUCKET_NAME,
              Key: photo.s3_key,
            })
            await s3Client.send(deleteCommand)
          } catch (s3Error) {
            console.error("S3 delete error for photo:", photo.s3_key, s3Error)
            // S3削除に失敗してもデータベースからは削除する
          }
        }
      }

      // データベースから写真を削除
      await query("DELETE FROM photos WHERE venue_id = $1", [venueId])

      // 会場を削除
      const result = await query("DELETE FROM venues WHERE id = $1 RETURNING *", [venueId])
      
      if (result.rows.length === 0) {
        return NextResponse.json({ message: "会場が見つかりません" }, { status: 404 })
      }

      return NextResponse.json({ 
        message: `会場と${photos.length}枚の写真を削除しました`,
        venue: result.rows[0]
      })
    } catch (error) {
      console.error("Delete venue error:", error)
      return NextResponse.json({ message: "会場の削除中にエラーが発生しました" }, { status: 500 })
    }
  }

  return NextResponse.json({ message: "Method not allowed" }, { status: 405 })
}

export const DELETE = withAdminAuth(handler) 