import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import crypto from 'crypto'

const s3 = new S3Client({ region: process.env.AWS_REGION || 'ap-northeast-1' })
const bucket = process.env.S3_BUCKET_NAME as string

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url)
		const key = searchParams.get('s3Key')
		const w = Number(searchParams.get('w') ?? 480)

		if (!key) return NextResponse.json({ error: 's3Key required' }, { status: 400 })

		const accept = req.headers.get('accept') || ''
		const preferAvif = accept.includes('image/avif')
		const preferWebp = accept.includes('image/webp')

		const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
		const body = await obj.Body!.transformToByteArray()
		const s3ETag = (obj.ETag || '').replace(/"/g, '')

		const variantKey = `${s3ETag}:${w}:${preferAvif ? 'avif' : preferWebp ? 'webp' : 'jpeg'}`
		const etag = crypto.createHash('sha1').update(variantKey).digest('hex')

		const inm = req.headers.get('if-none-match')
		if (inm && inm === etag) {
			return new NextResponse(null, { status: 304, headers: { ETag: etag } })
		}

		let pipeline = sharp(Buffer.from(body)).rotate().resize({ width: w, withoutEnlargement: true })
		let out: Buffer
		let contentType: string

		if (preferAvif) {
			out = await pipeline.avif({ quality: 50 }).toBuffer()
			contentType = 'image/avif'
		} else if (preferWebp) {
			out = await pipeline.webp({ quality: 65 }).toBuffer()
			contentType = 'image/webp'
		} else {
			out = await pipeline.jpeg({ quality: 70 }).toBuffer()
			contentType = 'image/jpeg'
		}

		return new NextResponse(out, {
			status: 200,
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=600, immutable',
				'ETag': etag,
				...(obj.LastModified ? { 'Last-Modified': new Date(obj.LastModified).toUTCString() } : {}),
			},
		})
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || 'thumb error' }, { status: 500 })
	}
} 