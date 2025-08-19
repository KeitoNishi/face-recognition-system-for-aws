import { NextRequest, NextResponse } from 'next/server'
import { RekognitionClient, SearchFacesByImageCommand, ListFacesCommand } from '@aws-sdk/client-rekognition'
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import { loadConfigFromParameterStore } from '@/lib/parameter-store'
import fs from 'fs'
import path from 'path'

const rekognition = new RekognitionClient({ region: process.env.AWS_REGION || 'ap-northeast-1' })
const s3 = new S3Client({ region: process.env.AWS_REGION || 'ap-northeast-1' })

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
    const { venueId } = await request.json()
    
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
    
    // 2. FaceIDマッピングを読み込み
    const faceMapping = loadFaceMapping()
    
    // 3. S3から写真一覧を取得
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: `venues/${venueId}/`,
    })
    
    const listResult = await s3.send(listCommand)
    const photos = listResult.Contents?.filter(obj => 
      obj.Key?.endsWith('.jpg') || obj.Key?.endsWith('.jpeg') || obj.Key?.endsWith('.png') || obj.Key?.endsWith('.JPG')
    ) || []
    
    // 4. 超効率的な検索実行（バッチ処理 + 並列化）
    const matchedPhotos = []
    const batchSize = 10 // 10枚ずつ並列処理
    
    for (let i = 0; i < photos.length; i += batchSize) {
      const batch = photos.slice(i, i + batchSize)
      
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
          
          // 効率的な顔検索
          const searchCommand = new SearchFacesByImageCommand({
            CollectionId: collectionId,
            Image: {
              Bytes: Buffer.from(imageBuffer),
            },
            MaxFaces: 3, // さらに制限
            FaceMatchThreshold: 85,
          })
          
          const searchResult = await rekognition.send(searchCommand)
          
          // 指定された顔IDとマッチするかチェック
          const matchedFace = searchResult.FaceMatches?.find(match => 
            match.Face?.FaceId === userFaceId
          )
          
          if (matchedFace) {
            return {
              id: photo.Key.split('/').pop()?.split('.')[0] || 'unknown',
              filename: photo.Key.split('/').pop() || 'unknown',
              s3Key: photo.Key,
              matched: true,
              confidence: matchedFace.Similarity || 0,
              faceId: matchedFace.Face?.FaceId,
            }
          }
          
          return null
          
        } catch (error) {
          console.error(`写真 ${photo.Key} の処理中にエラー:`, error)
          return null
        }
      })
      
      // バッチの結果を待機
      const batchResults = await Promise.all(batchPromises)
      const validResults = batchResults.filter(result => result !== null)
      matchedPhotos.push(...validResults)
      
      // API制限を避けるため少し待機
      if (i + batchSize < photos.length) {
        await new Promise(resolve => setTimeout(resolve, 50)) // 50ms待機
      }
    }
    
    return NextResponse.json({
      success: true,
      photos: matchedPhotos,
      totalPhotos: photos.length,
      matchedCount: matchedPhotos.length,
      processingTime: `${photos.length}枚の写真を処理しました`,
      userFaceId: userFaceId,
    })
    
  } catch (error) {
    console.error('顔認識フィルターエラー:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '顔認識フィルターの処理中にエラーが発生しました' 
      },
      { status: 500 }
    )
  }
} 