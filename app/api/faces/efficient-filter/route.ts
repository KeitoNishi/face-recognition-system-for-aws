import { NextRequest, NextResponse } from 'next/server'
import { RekognitionClient, SearchFacesByImageCommand } from '@aws-sdk/client-rekognition'
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import { loadConfigFromParameterStore } from '@/lib/parameter-store'




const rekognition = new RekognitionClient({ region: process.env.AWS_REGION || 'ap-northeast-1' })
const s3 = new S3Client({ region: process.env.AWS_REGION || 'ap-northeast-1' })

// キャッシュ用のMap（メモリ内）
const resultCache = new Map<string, { photos: any[], timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5分

// FaceIDマッピングを読み込み（簡略化）
function loadFaceMapping() {
  return {}
}

export async function POST(request: NextRequest) {
  try {
    const { venueId, useCache = true, batchSize = 5 } = await request.json()
    
    // Parameter Storeから設定を取得
    const config = await loadConfigFromParameterStore()
    const collectionId = config.rekognition_collection
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
    
    // ユーザーが顔を登録していない場合
    if (!userFaceId) {
      return NextResponse.json({
        success: false,
        error: '顔写真が登録されていません。まず顔写真を登録してください。',
        code: 'NO_FACE_REGISTERED'
      }, { status: 400 })
    }
    
    // 2. キャッシュチェック
    const cacheKey = `${venueId}_${userFaceId}`
    if (useCache && resultCache.has(cacheKey)) {
      const cached = resultCache.get(cacheKey)!
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return NextResponse.json({
          success: true,
          photos: cached.photos,
          totalPhotos: cached.photos.length,
          matchedCount: cached.photos.length,
          fromCache: true,
          userFaceId: userFaceId,
        })
      }
    }
    
    // 3. S3から写真一覧を取得
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: `venues/${venueId}/`,
    })
    
    const listResult = await s3.send(listCommand)
    const photos = listResult.Contents?.filter(obj => 
      obj.Key?.endsWith('.jpg') || obj.Key?.endsWith('.jpeg') || obj.Key?.endsWith('.png') || obj.Key?.endsWith('.JPG')
    ) || []
    
    // 4. 効率的な検索実行
    const matchedPhotos = []
    const startTime = Date.now()
    
    // 動的バッチサイズ調整（プランアップ対応）
    const dynamicBatchSize = photos.length > 50 ? 20 : photos.length > 20 ? 15 : 10
    
    for (let i = 0; i < photos.length; i += dynamicBatchSize) {
      const batch = photos.slice(i, i + dynamicBatchSize)
      
      // バッチ内の写真を並列処理
      const batchPromises = batch.map(async (photo) => {
        if (!photo.Key) return null
        
        try {
          // S3から画像を取得
          const getObjectCommand = new GetObjectCommand({
            Bucket: bucketName,
            Key: photo.Key,
          })
          
          const imageObject = await s3.send(getObjectCommand)
          const imageBuffer = await imageObject.Body?.transformToByteArray()
          
          if (!imageBuffer) return null
          
          // 画像サイズをチェック（10MB制限に緩和）
          if (imageBuffer.length > 10 * 1024 * 1024) {
            // 画像サイズ制限エラー
            return null
          }
          
          // 顔検索（精度を下げてマッチしやすくする）
          const searchCommand = new SearchFacesByImageCommand({
            CollectionId: collectionId,
            Image: {
              Bytes: Buffer.from(imageBuffer),
            },
            MaxFaces: 3,  // 複数の顔を検索
            FaceMatchThreshold: 70,  // 類似度閾値を下げる
          })
          
          const searchResult = await rekognition.send(searchCommand)
          
          // 指定された顔IDとマッチするかチェック
          const matchedFace = searchResult.FaceMatches?.find(match => 
            match.Face?.FaceId === userFaceId
          )
          
          if (matchedFace) {
            console.log(`マッチ発見: ${photo.Key}, 類似度: ${matchedFace.Similarity}%`)
            return {
              id: photo.Key.split('/').pop()?.split('.')[0] || 'unknown',
              filename: photo.Key.split('/').pop() || 'unknown',
              s3Key: photo.Key,
              matched: true,
              confidence: matchedFace.Similarity || 0,
              faceId: matchedFace.Face?.FaceId,
            }
          } else {
            // デバッグ: 検出された顔IDをログ出力
            if (searchResult.FaceMatches && searchResult.FaceMatches.length > 0) {
              console.log(`検出された顔ID: ${searchResult.FaceMatches.map(f => f.Face?.FaceId).join(', ')}`)
            }
          }
          
          return null
          
        } catch (error) {
          // エラー処理（簡略化）
          return null
        }
      })
      
      // バッチの結果を待機
      const batchResults = await Promise.all(batchPromises)
      const validResults = batchResults.filter(result => result !== null)
      matchedPhotos.push(...validResults)
      
      // API制限を避けるため最小限の待機（プランアップ対応）
      if (i + dynamicBatchSize < photos.length) {
        await new Promise(resolve => setTimeout(resolve, 2))  // 待機時間短縮
      }
    }
    
    const processingTime = Date.now() - startTime
    

    
    // 5. 結果をキャッシュに保存
    resultCache.set(cacheKey, {
      photos: matchedPhotos,
      timestamp: Date.now()
    })
    
    // キャッシュサイズ制限（メモリ保護）
    if (resultCache.size > 100) {
      const oldestKey = resultCache.keys().next().value
      if (oldestKey) {
        resultCache.delete(oldestKey)
      }
    }
    
    return NextResponse.json({
      success: true,
      photos: matchedPhotos,
      totalPhotos: photos.length,
      matchedCount: matchedPhotos.length,
      processingTime: `${processingTime}ms`,
      userFaceId: userFaceId,
      fromCache: false,
    })
    
  } catch (error) {
    console.error('効率的顔認識フィルターエラー:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '効率的顔認識フィルターの処理中にエラーが発生しました' 
      },
      { status: 500 }
    )
  }
} 