import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getSignedPhotoUrl } from "@/lib/aws"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const photoId = parseInt(params.id)
    
    if (isNaN(photoId)) {
      return NextResponse.json(
        { error: "無効な写真IDです" },
        { status: 400 }
      )
    }

    // 写真情報を取得
    const result = await query("SELECT * FROM photos WHERE id = $1", [photoId])
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "写真が見つかりません" },
        { status: 404 }
      )
    }

    const photo = result.rows[0]
    
    // S3から署名付きURLを取得
    const signedUrl = await getSignedPhotoUrl(photo.s3_key)
    
    // リダイレクトでS3の画像を返す
    return NextResponse.redirect(signedUrl)
  } catch (error) {
    console.error("写真取得エラー:", error)
    return NextResponse.json(
      { error: "写真の取得に失敗しました" },
      { status: 500 }
    )
  }
} 