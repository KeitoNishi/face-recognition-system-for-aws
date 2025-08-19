import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'

const s3 = new S3Client({ region: process.env.AWS_REGION || 'ap-northeast-1' })
const bucket = process.env.S3_BUCKET_NAME as string

export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url)
		const key = searchParams.get('s3Key')
		const w = Number(searchParams.get('w') ?? 480)

		if (!key) return NextResponse.json({ error: 's3Key required' }, { status: 400 })

		const obj = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
		const buf = Buffer.from(await obj.Body!.transformToByteArray())

		const out = await sharp(buf)
			.rotate()
			.resize({ width: w, withoutEnlargement: true })
			.jpeg({ quality: 70 })
			.toBuffer()

		return new NextResponse(out, {
			status: 200,
			headers: {
				'Content-Type': 'image/jpeg',
				'Cache-Control': 'public, max-age=600',
			},
		})
	} catch (e: any) {
		return NextResponse.json({ error: e?.message || 'thumb error' }, { status: 500 })
	}
} 