import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { loadConfigFromParameterStore } from '@/lib/parameter-store'

// S3クライアントをキャッシュ
let s3Client: S3Client | null = null
let configCache: any = null

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-northeast-1',
    })
  }
  return s3Client
}

export async function POST(request: NextRequest) {
  try {
    const { venueId } = await request.json()
    
    if (!venueId) {
      return NextResponse.json(
        { error: '会場IDが指定されていません' },
        { status: 400 }
      )
    }

    // 設定をキャッシュから取得（初回のみParameter Storeから取得）
    if (!configCache) {
      configCache = await loadConfigFromParameterStore()
    }
    
    const s3Client = getS3Client()

    // S3から指定会場の画像一覧を取得
    const command = new ListObjectsV2Command({
      Bucket: configCache.s3_bucket,
      Prefix: `venues/${venueId}/`,
      MaxKeys: 1000,
    })

    const response = await s3Client.send(command)
    
    if (!response.Contents) {
      return NextResponse.json({ photos: [] })
    }

    // 画像ファイルのみをフィルタリング（jpg, jpeg, png, gif）
    const imageFiles = response.Contents.filter(obj => {
      const key = obj.Key || ''
      const extension = key.toLowerCase().split('.').pop()
      return ['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')
    })

    const photos = imageFiles.map((obj, index) => ({
      id: `${venueId}_${index + 1}`,
      filename: obj.Key?.split('/').pop() || '',
      s3Key: obj.Key || '',
      url: `https://${configCache.s3_bucket}.s3.${process.env.AWS_REGION || 'ap-northeast-1'}.amazonaws.com/${obj.Key}`,
      size: obj.Size || 0,
      lastModified: obj.LastModified,
    }))

    return NextResponse.json({ photos })
    
  } catch (error) {
    console.error('S3画像一覧取得エラー:', error)
    return NextResponse.json(
      { error: '画像一覧の取得に失敗しました' },
      { status: 500 }
    )
  }
} 