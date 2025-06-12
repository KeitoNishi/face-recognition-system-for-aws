import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { indexFace, uploadPhotoToS3, detectFaces } from "@/lib/aws"
import { saveUserFace } from "@/lib/db"

export async function POST(req: NextRequest) {
  // セッション確認
  const cookieStore = cookies()
  const session = cookieStore.get("user_session")

  if (!session || session.value !== "authenticated") {
    return NextResponse.json({ message: "認証が必要です" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("face") as File

    if (!file) {
      return NextResponse.json({ message: "ファイルが必要です" }, { status: 400 })
    }

    // ファイルをバッファに変換
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 顔が含まれているか確認
    const hasFace = await detectFaces(buffer)
    if (!hasFace) {
      return NextResponse.json({ message: "顔が検出されませんでした" }, { status: 400 })
    }

    // S3にアップロード
    const timestamp = Date.now()
    const s3Key = `faces/${timestamp}-${file.name}`
    await uploadPhotoToS3(buffer, s3Key, file.type)

    // Rekognitionに顔を登録
    const faceId = await indexFace(buffer)

    if (!faceId) {
      return NextResponse.json({ message: "顔の登録に失敗しました" }, { status: 500 })
    }

    // データベースに保存
    await saveUserFace(s3Key, faceId)

    return NextResponse.json({ success: true, faceId })
  } catch (error) {
    console.error("Face registration error:", error)
    return NextResponse.json({ message: "顔の登録中にエラーが発生しました" }, { status: 500 })
  }
}
