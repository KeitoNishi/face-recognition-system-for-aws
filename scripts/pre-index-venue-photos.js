const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm')
const { RekognitionClient, IndexFacesCommand, DetectFacesCommand } = require('@aws-sdk/client-rekognition')
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3')

// AWS設定
const region = process.env.AWS_REGION || 'ap-northeast-1'
const ssmClient = new SSMClient({ region })
const rekognitionClient = new RekognitionClient({ region })
const s3Client = new S3Client({ region })

// 会場一覧
const venues = [
  'venue_01', 'venue_02', 'venue_03', 'venue_04', 'venue_05',
  'venue_06', 'venue_07', 'venue_08', 'venue_09', 'venue_10',
  'venue_11', 'venue_12', 'venue_13', 'venue_14', 'venue_15'
]

// Parameter Storeから設定を取得
async function loadConfig() {
  try {
    const environment = process.env.NODE_ENV === 'production' ? 'prod' : 'dev'
    const parameterPath = `/face-recognition/${environment}/config`
    
    const command = new GetParameterCommand({
      Name: parameterPath,
      WithDecryption: true,
    })

    const response = await ssmClient.send(command)
    const config = JSON.parse(response.Parameter?.Value || '{}')
    
    return {
      collectionId: config.aws?.rekognitionCollectionId,
      bucketName: config.aws?.s3Bucket
    }
  } catch (error) {
    console.error('設定の取得に失敗:', error)
    throw error
  }
}

// 会場の写真を事前登録
async function preIndexVenue(venueId, config) {
  console.log(`\n=== ${venueId} の処理を開始 ===`)
  
  try {
    // S3から写真一覧を取得
    const listCommand = new ListObjectsV2Command({
      Bucket: config.bucketName,
      Prefix: `venues/${venueId}/`,
    })
    
    const listResult = await s3Client.send(listCommand)
    const photos = listResult.Contents?.filter(obj => 
      obj.Key?.endsWith('.jpg') || obj.Key?.endsWith('.jpeg') || obj.Key?.endsWith('.png') || obj.Key?.endsWith('.JPG')
    ) || []
    
    console.log(`${venueId}: ${photos.length}枚の写真を発見`)
    
    if (photos.length === 0) {
      console.log(`${venueId}: 写真が見つかりませんでした`)
      return { venueId, indexedFaces: 0, errors: 0, totalPhotos: 0 }
    }
    
    let indexedFaces = 0
    let errors = 0
    const faceMapping = {}
    
    // 各写真に対して顔を検出してコレクションに登録
    for (const photo of photos) {
      if (!photo.Key) continue
      
      try {
        // S3から画像を取得
        const getObjectCommand = new GetObjectCommand({
          Bucket: config.bucketName,
          Key: photo.Key,
        })
        
        const imageObject = await s3Client.send(getObjectCommand)
        const imageBuffer = await imageObject.Body?.transformToByteArray()
        
        if (!imageBuffer) {
          console.error(`${photo.Key}: 画像データの取得に失敗`)
          errors++
          continue
        }
        
        // 顔を検出
        const detectCommand = new DetectFacesCommand({
          Image: {
            Bytes: Buffer.from(imageBuffer),
          },
          Attributes: ['ALL'],
        })
        
        const detectResult = await rekognitionClient.send(detectCommand)
        
        if (!detectResult.FaceDetails || detectResult.FaceDetails.length === 0) {
          console.log(`${photo.Key}: 顔が検出されませんでした`)
          continue
        }
        
        // 顔をコレクションに登録
        const indexCommand = new IndexFacesCommand({
          CollectionId: config.collectionId,
          Image: {
            Bytes: Buffer.from(imageBuffer),
          },
          DetectionAttributes: ['ALL'],
          ExternalImageId: photo.Key.replace(/[^a-zA-Z0-9_.\-:]/g, '_'), // 写真のパスを外部IDとして保存（特殊文字を置換）
        })
        
        const indexResult = await rekognitionClient.send(indexCommand)
        
        if (indexResult.FaceRecords && indexResult.FaceRecords.length > 0) {
          indexedFaces += indexResult.FaceRecords.length
          
          // FaceIDマッピングを保存
          indexResult.FaceRecords.forEach(record => {
            if (record.Face?.FaceId) {
              faceMapping[photo.Key] = record.Face.FaceId
            }
          })
          
          console.log(`${photo.Key}: ${indexResult.FaceRecords.length}個の顔を登録`)
        } else {
          console.log(`${photo.Key}: 顔の登録に失敗`)
          errors++
        }
        
        // API制限を避けるため少し待機
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`${photo.Key}: エラー - ${error.message}`)
        errors++
      }
    }
    
    console.log(`${venueId} 完了: ${indexedFaces}個の顔を登録, ${errors}個のエラー`)
    
    return { 
      venueId, 
      indexedFaces, 
      errors, 
      totalPhotos: photos.length,
      faceMapping
    }
    
  } catch (error) {
    console.error(`${venueId} の処理でエラー:`, error)
    return { venueId, indexedFaces: 0, errors: 1, totalPhotos: 0, faceMapping: {} }
  }
}

// メイン処理
async function main() {
  console.log('=== 会場写真の事前登録開始 ===')
  
  try {
    const config = await loadConfig()
    console.log(`コレクションID: ${config.collectionId}`)
    console.log(`S3バケット: ${config.bucketName}`)
    
    const results = []
    const allFaceMappings = {}
    
    // 指定された会場のみ処理するか、全会場処理するか
    const targetVenues = process.argv[2] ? [process.argv[2]] : venues
    
    for (const venue of targetVenues) {
      const result = await preIndexVenue(venue, config)
      results.push(result)
      
      // FaceIDマッピングを統合
      Object.assign(allFaceMappings, result.faceMapping)
      
      // 会場間で少し待機
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    // 結果サマリー
    console.log('\n=== 処理完了サマリー ===')
    const totalIndexed = results.reduce((sum, r) => sum + r.indexedFaces, 0)
    const totalErrors = results.reduce((sum, r) => sum + r.errors, 0)
    const totalPhotos = results.reduce((sum, r) => sum + r.totalPhotos, 0)
    
    console.log(`総写真数: ${totalPhotos}`)
    console.log(`総登録顔数: ${totalIndexed}`)
    console.log(`総エラー数: ${totalErrors}`)
    
    console.log('\n会場別詳細:')
    results.forEach(result => {
      console.log(`${result.venueId}: ${result.indexedFaces}個の顔, ${result.errors}個のエラー`)
    })
    
    // FaceIDマッピングをファイルに保存
    const fs = require('fs')
    const mappingPath = './face-id-mapping.json'
    fs.writeFileSync(mappingPath, JSON.stringify(allFaceMappings, null, 2))
    console.log(`\nFaceIDマッピングを保存: ${mappingPath}`)
    
  } catch (error) {
    console.error('メイン処理でエラー:', error)
    process.exit(1)
  }
}

// スクリプト実行
if (require.main === module) {
  main()
} 