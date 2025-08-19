import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
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

// S3から全キーを取得（ページネーション対応）
async function listAll(bucket: string, prefix: string) {
  const keys: string[] = []
  let token: string | undefined
  do {
    const out = await s3Client!.send(new ListObjectsV2Command({ 
      Bucket: bucket, 
      Prefix: prefix, 
      MaxKeys: 1000, 
      ContinuationToken: token 
    }))
    keys.push(...(out.Contents?.map(o => o.Key!).filter(Boolean) ?? []))
    token = out.IsTruncated ? out.NextContinuationToken : undefined
  } while (token)
  return keys
}

export async function POST(request: NextRequest) {
  try {
    const { venueId } = await request.json()
    
    // API受信
    
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

    // S3から指定会場の画像一覧を取得（ページネーション対応）
    const prefix = `venues/${venueId}/`
    const keys = await listAll(configCache.s3_bucket, prefix)
    
    // 画像ファイルのみをフィルタリング（jpg, jpeg, png, gif）
    const imageKeys = keys.filter(key => {
      const extension = key.toLowerCase().split('.').pop()
      return ['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')
    })
    
    // フィルタリング完了

    // 署名付きURLを生成
    const photos = await Promise.all(imageKeys.map(async (Key, index) => {
      const url = await getSignedUrl(s3Client, new GetObjectCommand({ 
        Bucket: configCache.s3_bucket, 
        Key 
      }), { expiresIn: 3600 })
      
      return {
        id: `${venueId}_${index + 1}`,
        filename: Key.split('/').pop() || '',
        s3Key: Key,
        url,
        matched: false,
        confidence: 0
      }
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