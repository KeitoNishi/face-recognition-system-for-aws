import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { cookies } from 'next/headers'

const s3 = new S3Client({ region: process.env.AWS_REGION || 'ap-northeast-1' })
const bucket = process.env.S3_BUCKET_NAME as string

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData()
		// 後方互換: 'file' がなければ 'faceImage' も受け付ける
		const file = (formData.get('file') || formData.get('faceImage')) as File | null
		const venueId = (formData.get('venueId') as string | null) || null

		if (!file) {
			return NextResponse.json({ error: 'file required' }, { status: 400 })
		}

		// ファイルサイズチェック（5MB以下）
		if (file.size > 5 * 1024 * 1024) {
			return NextResponse.json(
				{ error: 'ファイルサイズが大きすぎます（5MB以下にしてください）' },
				{ status: 400 }
			)
		}

		// ファイル形式チェック（JPEG/PNG のみ）
		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png']
		if (!allowedTypes.includes(file.type)) {
			return NextResponse.json(
				{ error: '対応していないファイル形式です（JPEG、PNGのみ対応）' },
				{ status: 400 }
			)
		}

		// S3キー: セッション単位で保存（上書き前提）
		const c = await cookies();
		const sid = c.get('session_id')?.value ?? 'anon'
		const ext = (file.type?.split('/')[1] || 'jpg').toLowerCase()
		const key = `session_faces/${sid}/face.${ext}`

		const arrayBuffer = await file.arrayBuffer()
		await s3.send(new PutObjectCommand({
			Bucket: bucket,
			Key: key,
			Body: Buffer.from(arrayBuffer),
			ContentType: file.type || 'image/jpeg',
			CacheControl: 'no-store',
		}))

		// face_info クッキーを設定してフロントで登録済み表示可能にする
		const faceInfo = {
			faceId: 'session',
			registeredAt: new Date().toISOString(),
			confidence: 0,
			s3Key: key,
		}
		const response = NextResponse.json({
			success: true,
			message: '顔写真を登録しました',
			faceS3Key: key,
			venueId,
		})
		response.cookies.set('face_info', JSON.stringify(faceInfo), {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
		})
		return response
	} catch (error) {
		console.error('face register error:', error)
		return NextResponse.json({ error: 'failed to register face' }, { status: 500 })
	}
} 