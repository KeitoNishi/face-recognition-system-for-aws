import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { loadConfigFromParameterStore } from '@/lib/parameter-store'
import fs from 'fs'
import path from 'path'

const s3 = new S3Client({ region: process.env.AWS_REGION || 'ap-northeast-1' })

// キャッシュ用のMap（メモリ内）
const resultCache = new Map<string, { photos: any[], timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5分

// FaceIDマッピングを読み込み
function loadFaceMapping() {
  try {
    const mappingPath = path.join(process.cwd(), 'face-id-mapping.json')
    if (fs.existsSync(mappingPath)) {
      const mappingData = fs.readFileSync(mappingPath, 'utf8')
      return JSON.parse(mappingData)
    }
    return {}
  } catch (error) {
    console.error('FaceIDマッピングの読み込みエラー:', error)
    return {}
  }
}

export async function POST(request: NextRequest) {
  try {
    const { venueId, useCache = true } = await request.json()
    
    // Parameter Storeから設定を取得
    const config = await loadConfigFromParameterStore()
    const bucketName = config.s3_bucket
    
    // 1. ユーザーの顔IDを取得（セッションから）
    const faceInfo = request.cookies.get('face_info')
    let userFaceId = null
    
    if (faceInfo) {
      try {
        const parsedFaceInfo = JSON.parse(faceInfo.value)
        userFaceId = parsedFaceInfo.faceId
      } catch (error) {
        console.error('顔情報の解析エラー:', error)
      }
    }
    
    // ユーザーが顔を登録していない場合は、200で空配列を返しフロント側フォールバックを許可
    if (!userFaceId) {
      return NextResponse.json({
        success: true,
        matchedPhotos: [],
        totalPhotos: 0,
        matchedCount: 0,
        fromCache: false,
        userFaceId: null,
        method: 'ultra-fast'
      }, { status: 200 })
    }
    
    // 2. キャッシュチェック
    const cacheKey = `${venueId}_${userFaceId}_ultra`
    if (useCache && resultCache.has(cacheKey)) {
      const cached = resultCache.get(cacheKey)!
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return NextResponse.json({
          success: true,
          matchedPhotos: cached.photos,
          totalPhotos: cached.photos.length,
          matchedCount: cached.photos.length,
          fromCache: true,
          userFaceId: userFaceId,
          method: 'ultra-fast'
        })
      }
    }
    
    const startTime = Date.now()
    
    // 3. FaceIDマッピングから直接検索（超高速）
    const faceMapping = loadFaceMapping()
    
    // デバッグ情報をログ出力
    console.log(`Ultra-fast filter debug: venueId=${venueId}, userFaceId=${userFaceId}`)
    console.log(`Face mapping entries: ${Object.keys(faceMapping).length}`)
    console.log(`Venue photos: ${Object.keys(faceMapping).filter(key => key.includes(`venues/${venueId}/`)).length}`)
    
    // 指定会場の写真で、ユーザーFaceIDとマッチするものを抽出
    const matchedPhotos = []
    
    for (const [photoKey, faceId] of Object.entries(faceMapping)) {
      if (photoKey.includes(`venues/${venueId}/`) && faceId === userFaceId) {
        const filename = photoKey.split('/').pop() || 'unknown'
        const id = filename.split('.')[0] || 'unknown'
        
        matchedPhotos.push({
          id: id,
          filename: filename,
          s3Key: photoKey,
          matched: true,
          confidence: 95.0, // 事前インデックス化済みのため高信頼度
          faceId: faceId,
          method: 'pre-indexed'
        })
      }
    }
    
    // サインドURLとサムネイルURLを付与
    const withUrls = await Promise.all(matchedPhotos.map(async (p: any) => {
      const url = await getSignedUrl(s3, new GetObjectCommand({ Bucket: bucketName, Key: p.s3Key }), { expiresIn: 600 })
      const thumbUrl = `/api/photos/thumb?s3Key=${encodeURIComponent(p.s3Key)}&w=480`
      return { ...p, url, thumbUrl }
    }))
    
    console.log(`Matched photos: ${withUrls.length}`)
    
    const processingTime = Date.now() - startTime
    
    // 4. 結果をキャッシュに保存
    resultCache.set(cacheKey, {
      photos: withUrls,
      timestamp: Date.now()
    })
    
    // キャッシュサイズ制限
    if (resultCache.size > 100) {
      const oldestKey = resultCache.keys().next().value
      if (oldestKey) {
        resultCache.delete(oldestKey)
      }
    }
    
    // 処理完了
    
    return NextResponse.json({
      success: true,
      matchedPhotos: withUrls,
      totalPhotos: Object.keys(faceMapping).filter(key => key.includes(`venues/${venueId}/`)).length,
      matchedCount: withUrls.length,
      processingTime: `${processingTime}ms`,
      userFaceId: userFaceId,
      fromCache: false,
      method: 'ultra-fast'
    })
    
  } catch (error) {
    console.error('超高速フィルターエラー:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '超高速フィルターの処理中にエラーが発生しました' 
      },
      { status: 500 }
    )
  }
} 