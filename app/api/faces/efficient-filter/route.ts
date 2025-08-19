import { NextRequest, NextResponse } from 'next/server'
import { RekognitionClient, SearchFacesByImageCommand } from '@aws-sdk/client-rekognition'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { bucketName, resolveVenueCollection } from '@/lib/aws'
import { cookies } from 'next/headers'

const region = process.env.AWS_REGION!
const rekog = new RekognitionClient({ region })
const s3 = new S3Client({ region })
const fallback = process.env.REKOG_FALLBACK_COLLECTION

const buildPhoto = (extId: string, similarity: number) => {
  const s3Key = extId.replace(/_/g, '/')  // アンダースコアをスラッシュに戻す
  return {
    id: s3Key,
    filename: s3Key.split('/').pop() || s3Key,
    s3Key,
    url: '',
    matched: true,
    confidence: similarity
  }
}

async function searchBytes(collectionId: string, bytes: Buffer, th: number, top: number) {
  return await rekog.send(new SearchFacesByImageCommand({
    CollectionId: collectionId,
    Image: { Bytes: bytes },
    FaceMatchThreshold: th,
    MaxFaces: top
  }))
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''
    let venueId = ''
    let bytes: Buffer | null = null

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      venueId = String(form.get('venueId') || '')
      const file = form.get('file') as File | null
      if (file) bytes = Buffer.from(await file.arrayBuffer())
    } else {
      const body = await req.json()
      venueId = String(body.venueId || '')
      // 互換: S3キーが来る場合はここで取得して bytes に
      // const { sessionKey } = body; const obj = await s3.send(new GetObjectCommand({ Bucket: bucketName, Key: sessionKey })); bytes = Buffer.from(await obj.Body?.transformToByteArray() || [])
    }

    if (!venueId) return NextResponse.json({ error: 'venueId is required' }, { status: 400 })

    // 追加: セッションに保存されている顔画像をS3から自動取得
    if (!bytes) {
      const c = await cookies()
      const sid = c.get('session_id')?.value
      if (sid) {
        const candidates = [
          `session_faces/${sid}/face.jpg`,
          `session_faces/${sid}/face.jpeg`,
          `session_faces/${sid}/face.png`,
        ]
        for (const key of candidates) {
          try {
            const obj = await s3.send(new GetObjectCommand({ Bucket: bucketName, Key: key }))
            const arr = await obj.Body?.transformToByteArray()
            if (arr && arr.length > 0) {
              bytes = Buffer.from(arr)
              break
            }
          } catch {}
        }
      }
    }

    if (!bytes)   return NextResponse.json({ error: 'NO_FACE_REGISTERED', code: 'NO_FACE_REGISTERED' }, { status: 400 })

    const collection = resolveVenueCollection(venueId)
    const tries = [
      { th: 90, top: 20 },
      { th: 85, top: 50 },
      { th: 80, top: 100 }
    ]

    const collections = [collection, fallback].filter(Boolean) as string[]

    for (const cid of collections) {
      for (const t of tries) {
        const res = await searchBytes(cid, bytes, t.th, t.top)
        const matches = res.FaceMatches || []
        if (matches.length > 0) {
          const items = matches
            .filter(m => m.Face?.ExternalImageId)
            .map(m => buildPhoto(m.Face!.ExternalImageId!, m.Similarity ?? 0))

          const withUrls = await Promise.all(items.map(async p => {
            const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: bucketName, Key: p.s3Key }), { expiresIn: 600 })
            return { ...p, url }
          }))

          return NextResponse.json({ photos: withUrls }, { status: 200 })
        }
      }
    }

    return NextResponse.json({ photos: [] }, { status: 200 })
  } catch (e: any) {
    console.error('efficient-filter error', e)
    return NextResponse.json({ error: e?.message || 'Internal Error' }, { status: 500 })
  }
} 