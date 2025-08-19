import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { loadConfigFromParameterStore } from '@/lib/parameter-store'
import https from 'https'
import { NodeHttpHandler } from '@smithy/node-http-handler'

const agent = new https.Agent({ keepAlive: true, maxSockets: 64 })

let s3Client: S3Client | null = null
let configCache: any = null

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'ap-northeast-1',
      requestHandler: new NodeHttpHandler({ httpsAgent: agent })
    })
  }
  return s3Client
}

async function listAll(s3: S3Client, bucket: string, prefix: string) {
  const keys: string[] = []
  let token: string | undefined
  do {
    const out = await s3.send(new ListObjectsV2Command({
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
    if (!venueId) {
      return NextResponse.json({ error: '会場IDが指定されていません' }, { status: 400 })
    }

    if (!configCache) {
      configCache = await loadConfigFromParameterStore()
    }
    const s3 = getS3Client()

    const prefix = `venues/${venueId}/`
    const keys = await listAll(s3, configCache.s3_bucket, prefix)

    const imageKeys = keys.filter(key => {
      const ext = key.toLowerCase().split('.').pop() || ''
      return ['jpg', 'jpeg', 'png', 'gif'].includes(ext)
    })

    const photos = await Promise.all(imageKeys.map(async (Key) => {
      const url = await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: configCache.s3_bucket, Key }),
        { expiresIn: 600 }
      )
      const thumbUrl = `/api/photos/thumb?s3Key=${encodeURIComponent(Key)}&w=480`
      return {
        id: Key,
        filename: Key.split('/').pop() || '',
        s3Key: Key,
        url,
        thumbUrl,
        matched: false,
        confidence: 0
      }
    }))

    return NextResponse.json(
      { photos },
      { headers: { 'Cache-Control': 'public, max-age=120' } }
    )
  } catch (error) {
    console.error('S3画像一覧取得エラー:', error)
    return NextResponse.json({ error: '画像一覧の取得に失敗しました' }, { status: 500 })
  }
} 