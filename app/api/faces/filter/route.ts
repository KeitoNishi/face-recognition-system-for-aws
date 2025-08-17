import { NextRequest, NextResponse } from 'next/server'
import { RekognitionClient, SearchFacesByImageCommand } from '@aws-sdk/client-rekognition'
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import { loadConfigFromParameterStore } from '@/lib/parameter-store'

const rekognition = new RekognitionClient({ region: process.env.AWS_REGION || 'ap-northeast-1' })
const s3 = new S3Client({ region: process.env.AWS_REGION || 'ap-northeast-1' })

export async function POST(request: NextRequest) {
  try {
    const { venueId } = await request.json()
    
    // Parameter Storeから設定を取得
    const config = await loadConfigFromParameterStore()
    const collectionId = config.rekognition_collection
    const bucketName = config.s3_bucket
    
    // S3から写真一覧を取得（venues/venue_01/の構造に合わせる）
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: `venues/${venueId}/`,
    })
    
    const listResult = await s3.send(listCommand)
    const photos = listResult.Contents?.filter(obj => 
      obj.Key?.endsWith('.jpg') || obj.Key?.endsWith('.jpeg') || obj.Key?.endsWith('.png') || obj.Key?.endsWith('.JPG')
    ) || []
    
    // 各写真に対して顔認識を実行
    const matchedPhotos = []
    
    for (const photo of photos) {
      if (!photo.Key) continue
      
      try {
        // S3から画像を取得
        const getObjectCommand = new GetObjectCommand({
          Bucket: bucketName,
          Key: photo.Key,
        })
        
        const imageObject = await s3.send(getObjectCommand)
        const imageBuffer = await imageObject.Body?.transformToByteArray()
        
        if (!imageBuffer) continue
        
        // Rekognitionで顔検索を実行
        const searchCommand = new SearchFacesByImageCommand({
          CollectionId: collectionId,
          Image: {
            Bytes: Buffer.from(imageBuffer),
          },
          MaxFaces: 10,
          FaceMatchThreshold: 90,
        })
        
        const searchResult = await rekognition.send(searchCommand)
        
        // 顔が検出された場合、マッチした写真として追加
        if (searchResult.FaceMatches && searchResult.FaceMatches.length > 0) {
          matchedPhotos.push({
            id: photo.Key.split('/').pop()?.split('.')[0] || 'unknown',
            filename: photo.Key.split('/').pop() || 'unknown',
            s3Key: photo.Key,
            matched: true,
            confidence: searchResult.FaceMatches[0].Similarity || 0,
          })
        } else {
          // マッチしなかった場合でも写真を表示
          matchedPhotos.push({
            id: photo.Key.split('/').pop()?.split('.')[0] || 'unknown',
            filename: photo.Key.split('/').pop() || 'unknown',
            s3Key: photo.Key,
            matched: false,
            confidence: 0,
          })
        }
      } catch (error) {
        console.error(`写真 ${photo.Key} の処理中にエラーが発生:`, error)
        // エラーが発生した場合でも写真を表示（マッチしていないとして）
        matchedPhotos.push({
          id: photo.Key.split('/').pop()?.split('.')[0] || 'unknown',
          filename: photo.Key.split('/').pop() || 'unknown',
          s3Key: photo.Key,
          matched: false,
          confidence: 0,
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      photos: matchedPhotos,
      totalPhotos: photos.length,
      matchedCount: matchedPhotos.filter(p => p.matched).length,
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