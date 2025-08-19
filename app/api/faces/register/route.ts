import { NextRequest, NextResponse } from 'next/server'
import { indexFace, detectFaces } from '@/lib/aws'
import { loadConfigFromParameterStore } from '@/lib/parameter-store'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('faceImage') as File
    
    if (!file) {
      return NextResponse.json(
        { error: '顔写真がアップロードされていません' },
        { status: 400 }
      )
    }

    // ファイルサイズチェック（5MB以下）
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'ファイルサイズが大きすぎます（5MB以下にしてください）' },
        { status: 400 }
      )
    }

    // ファイル形式チェック
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '対応していないファイル形式です（JPEG、PNGのみ対応）' },
        { status: 400 }
      )
    }

    // ファイルをバッファに変換
    const buffer = Buffer.from(await file.arrayBuffer())

    // 顔が含まれているかチェック
    const hasFaces = await detectFaces(buffer)
    if (!hasFaces) {
      return NextResponse.json(
        { error: '顔が検出されませんでした。顔がはっきり写っている写真を選択してください。' },
        { status: 400 }
      )
    }

    // 顔をRekognitionコレクションに登録
    const faceId = await indexFace(buffer)

    // セッションに顔情報を保存
    const faceInfo = {
      faceId: faceId,
      registeredAt: new Date().toISOString(),
      confidence: 95.5 // 仮の値、実際はRekognitionから取得
    }

    const response = NextResponse.json({
      success: true,
      faceId: faceId,
      faceInfo: faceInfo,
      message: '顔写真が正常に登録されました（セッション限定）'
    })

    // セッションクッキーに顔情報を保存（セッション終了時に自動削除）
    response.cookies.set('face_info', JSON.stringify(faceInfo), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      // maxAgeを設定しない = ブラウザセッション終了時に自動削除
    })

    return response

  } catch (error) {
    console.error('顔写真登録エラー:', error)
    
    // エラーメッセージを適切に処理
    let errorMessage = '顔写真の登録中にエラーが発生しました'
    
    if (error instanceof Error) {
      if (error.message.includes('顔を検出できませんでした')) {
        errorMessage = '顔が検出されませんでした。顔がはっきり写っている写真を選択してください。'
      } else if (error.message.includes('CollectionNotFound')) {
        errorMessage = '顔認識コレクションが見つかりません。システム管理者に連絡してください。'
      } else if (error.message.includes('AccessDenied')) {
        errorMessage = 'アクセス権限がありません。システム管理者に連絡してください。'
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
} 