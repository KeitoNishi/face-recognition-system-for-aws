import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getPhotosByVenueId } from "@/lib/db"
import { getSignedPhotoUrl, searchFacesByImage } from "@/lib/aws"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-northeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function GET(req: NextRequest) {
  // セッション確認
  const cookieStore = cookies()
  const session = cookieStore.get("user_session")

  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ message: "認証が必要です" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const venueId = Number.parseInt(searchParams.get("venueId") || "")

    if (isNaN(venueId)) {
      return NextResponse.json({ message: "会場IDが必要です" }, { status: 400 })
    }

    // 登録済みの顔写真を取得
    const userFaceResponse = await fetch(`${req.nextUrl.origin}/api/faces/current`, {
      headers: {
        Cookie: `user_session=${session.value}`,
      },
    })

    if (!userFaceResponse.ok) {
      return NextResponse.json({ message: "顔写真が登録されていません" }, { status: 400 })
    }

    const { faceId, s3Key } = await userFaceResponse.json()

    // S3から顔写真を取得
    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: s3Key,
    })

    const s3Response = await s3Client.send(getObjectCommand)
    const faceImageBuffer = await s3Response.Body?.transformToByteArray()

    if (!faceImageBuffer) {
      return NextResponse.json({ message: "顔写真の取得に失敗しました" }, { status: 500 })
    }

    // 会場の写真を取得
    const photos = await getPhotosByVenueId(venueId)

    // 顔認識で写真を絞り込み
    const faceMatches = await searchFacesByImage(Buffer.from(faceImageBuffer))
    const matchedFaceIds = faceMatches.map((match) => match.Face?.FaceId)

    // 署名付きURLを取得
    const photosWithUrls = await Promise.all(
      photos.map(async (photo) => {
        const url = await getSignedPhotoUrl(photo.s3_key)
        return { ...photo, url }
      }),
    )

    // 絞り込み結果を返す
    return NextResponse.json({
      photos: photosWithUrls,
      matchCount: faceMatches.length,
    })
  } catch (error) {
    console.error("Photo filtering error:", error)
    return NextResponse.json({ message: "写真の絞り込み中にエラーが発生しました" }, { status: 500 })
  }
}
