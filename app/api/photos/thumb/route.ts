import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { loadConfigFromParameterStore } from '@/lib/parameter-store'
import sharp from 'sharp'

const s3 = new S3Client({ region: process.env.AWS_REGION || 'ap-northeast-1' })

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const key = searchParams.get('s3Key')
    const requestedW = Number(searchParams.get('w') ?? 480)

    if (!key) return NextResponse.json({ error: 's3Key required' }, { status: 400 })

    // Parameter Storeから設定を取得
    const config = await loadConfigFromParameterStore()
    const bucket = config.s3_bucket

    // 許可する幅を固定（ホワイトリスト）
    const allowedWidths = [320, 480, 640]
    const w = allowedWidths.includes(requestedW)
      ? requestedW
      : allowedWidths.reduce((prev, curr) => Math.abs(curr - requestedW) < Math.abs(prev - requestedW) ? curr : prev, 480)

    // 元画像のパスからサムネイルパスを生成
    const venueId = key.split('/')[1] // venues/venue_01/filename -> venue_01
    const filename = key.split('/').pop() || ''
    const baseName = filename.replace(/\.[^/.]+$/, '') // 拡張子を除去
    
    // サムネイルのS3キーを生成
    const thumbnailKey = `thumbnails/${venueId}/${baseName}_${w}.jpg`

    try {
      // 1. まずthumbnailsディレクトリからサムネイルを取得
      const thumbnailObj = await s3.send(new GetObjectCommand({ 
        Bucket: bucket, 
        Key: thumbnailKey 
      }))
      
      const thumbnailBody = await thumbnailObj.Body!.transformToByteArray()
      const etag = (thumbnailObj.ETag || '').replace(/"/g, '')

      // キャッシュチェック
      const inm = req.headers.get('if-none-match')
      if (inm && inm === etag) {
        return new NextResponse(null, { status: 304, headers: { ETag: etag } })
      }

      return new NextResponse(thumbnailBody, {
        status: 200,
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable', // 1年間キャッシュ
          'ETag': etag,
          ...(thumbnailObj.LastModified ? { 'Last-Modified': new Date(thumbnailObj.LastModified).toUTCString() } : {}),
        },
      })

    } catch (thumbnailError) {
      // 2. サムネイルが存在しない場合は動的に生成
      try {
        // 元画像を取得
        const originalObj = await s3.send(new GetObjectCommand({ 
          Bucket: bucket, 
          Key: key 
        }))
        
        const originalBuffer = Buffer.from(await originalObj.Body!.transformToByteArray())
        
        // Sharpでサムネイル生成（EXIF情報のOrientationタグを自動処理）
        const thumbnailBuffer = await sharp(originalBuffer)
          .rotate() // EXIF情報に基づいて自動回転
          .resize(w, null, { 
            withoutEnlargement: true,
            fit: 'inside'
          })
          .jpeg({ quality: 85 })
          .toBuffer()

        // サムネイルをS3に保存
        await s3.send(new PutObjectCommand({
          Bucket: bucket,
          Key: thumbnailKey,
          Body: thumbnailBuffer,
          ContentType: 'image/jpeg',
          CacheControl: 'public, max-age=31536000, immutable',
        }))

        return new NextResponse(thumbnailBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        })

      } catch (originalError) {
        console.error('元画像取得エラー:', originalError)
        return new NextResponse(null, { status: 404 })
      }
    }

  } catch (e: any) {
    console.error('サムネイル生成エラー:', e)
    return NextResponse.json({ error: e?.message || 'thumb error' }, { status: 500 })
  }
} 