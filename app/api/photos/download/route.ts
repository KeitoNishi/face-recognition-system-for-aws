import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { loadConfigFromParameterStore } from '@/lib/parameter-store'

export async function POST(request: NextRequest) {
  try {
    const { s3Key, filename } = await request.json()
    
    if (!s3Key) {
      return NextResponse.json(
        { error: 'S3キーが指定されていません' },
        { status: 400 }
      )
    }

    // Parameter Storeから設定を取得
    const config = await loadConfigFromParameterStore()
    
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-northeast-1',
    })

    // S3から画像を取得
    const command = new GetObjectCommand({
      Bucket: config.s3_bucket,
      Key: s3Key,
    })

    const response = await s3Client.send(command)
    
    if (!response.Body) {
      return NextResponse.json(
        { error: '画像が見つかりません' },
        { status: 404 }
      )
    }

    // 画像データを取得
    const imageBuffer = await response.Body.transformToByteArray()
    
    // レスポンスヘッダーを設定
    const headers = new Headers()
    headers.set('Content-Type', response.ContentType || 'image/jpeg')
    headers.set('Content-Disposition', `attachment; filename="${filename || 'image.jpg'}"`)
    headers.set('Content-Length', response.ContentLength?.toString() || '0')
    
    return new NextResponse(imageBuffer, {
      status: 200,
      headers,
    })
    
  } catch (error) {
    console.error('S3画像ダウンロードエラー:', error)
    return NextResponse.json(
      { error: '画像のダウンロードに失敗しました' },
      { status: 500 }
    )
  }
} 