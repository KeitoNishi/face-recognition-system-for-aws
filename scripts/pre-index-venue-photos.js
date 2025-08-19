const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm')
const { RekognitionClient, CreateCollectionCommand, IndexFacesCommand, DetectFacesCommand } = require('@aws-sdk/client-rekognition')
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3')
const sharp = require('sharp')

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

// 会場別コレクションIDを解決
const resolveVenueCollection = (venueId) => {
  const prefix = process.env.REKOG_COLLECTION_PREFIX || 'face-recognition'
  return `${prefix}-${venueId}`  // 例: face-recognition-venue_01
}

// S3から全キーを取得（ページネーション対応）
async function listAllKeys(Bucket, Prefix) {
  const keys = []
  let token
  do {
    const out = await s3Client.send(new ListObjectsV2Command({ 
      Bucket, 
      Prefix, 
      MaxKeys: 1000, 
      ContinuationToken: token 
    }))
    keys.push(...(out.Contents?.map(o => o.Key).filter(Boolean) ?? []))
    token = out.IsTruncated ? out.NextContinuationToken : undefined
  } while (token)
  return keys
}

// 画像をリサイズして5MB以下にする
async function resizeImageIfNeeded(imageBuffer) {
  try {
    const maxSize = 5 * 1024 * 1024 // 5MB
    
    if (imageBuffer.length <= maxSize) {
      return imageBuffer
    }
    
    console.log(`画像サイズが大きすぎます (${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB)。リサイズします...`)
    
    // sharpでリサイズ
    const resizedBuffer = await sharp(imageBuffer)
      .resize(1024, 1024, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .jpeg({ quality: 80 })
      .toBuffer()
    
    console.log(`リサイズ完了: ${(resizedBuffer.length / 1024 / 1024).toFixed(2)}MB`)
    return resizedBuffer
    
  } catch (error) {
    console.error('画像リサイズエラー:', error)
    return imageBuffer // エラーの場合は元の画像を返す
  }
}

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
    const collectionId = resolveVenueCollection(venueId)
    
    // コレクションを作成（冪等性を保つ）
    try {
      await rekognitionClient.send(new CreateCollectionCommand({ CollectionId: collectionId }))
      console.log(`${venueId}: コレクション ${collectionId} を作成しました`)
    } catch (e) {
      if (e.name === 'ResourceAlreadyExistsException') {
        console.log(`${venueId}: コレクション ${collectionId} は既に存在します`)
      } else {
        throw e
      }
    }
    
    // S3から写真一覧を取得（ページネーション対応）
    const keys = await listAllKeys(config.bucketName, `venues/${venueId}/`)
    const photos = keys.filter(key => 
      key.endsWith('.jpg') || key.endsWith('.jpeg') || key.endsWith('.png') || key.endsWith('.JPG')
    )
    
    console.log(`${venueId}: ${photos.length}枚の写真を発見`)
    
    if (photos.length === 0) {
      console.log(`${venueId}: 写真が見つかりませんでした`)
      return { venueId, indexedFaces: 0, errors: 0, totalPhotos: 0 }
    }
    
    let indexedFaces = 0
    let errors = 0
    
    // 各写真に対して顔を検出してコレクションに登録
    for (const Key of photos) {
      try {
        // S3から画像を取得
        const getObjectCommand = new GetObjectCommand({
          Bucket: config.bucketName,
          Key: Key,
        })
        
        const imageObject = await s3Client.send(getObjectCommand)
        const imageBuffer = await imageObject.Body?.transformToByteArray()
        
        if (!imageBuffer) {
          console.error(`${Key}: 画像データの取得に失敗`)
          errors++
          continue
        }
        
        // 画像サイズをチェックしてリサイズ
        const processedBuffer = await resizeImageIfNeeded(Buffer.from(imageBuffer))
        
        // 顔を検出
        const detectCommand = new DetectFacesCommand({
          Image: {
            Bytes: processedBuffer,
          },
          Attributes: ['ALL'],
        })
        
        const detectResult = await rekognitionClient.send(detectCommand)
        
        if (!detectResult.FaceDetails || detectResult.FaceDetails.length === 0) {
          console.log(`${Key}: 顔が検出されませんでした`)
          continue
        }
        
        // 顔をコレクションに登録（ExternalImageIdにS3キーを設定）
        const indexCommand = new IndexFacesCommand({
          CollectionId: collectionId,
          Image: {
            Bytes: processedBuffer,
          },
          QualityFilter: 'AUTO',
          ExternalImageId: Key.replace(/\//g, '_'),     // ★ スラッシュをアンダースコアに置換
          MaxFaces: 5
        })
        
        const indexResult = await rekognitionClient.send(indexCommand)
        
        if (indexResult.FaceRecords && indexResult.FaceRecords.length > 0) {
          indexedFaces += indexResult.FaceRecords.length
          console.log(`${Key}: ${indexResult.FaceRecords.length}個の顔を登録`)
        } else {
          console.log(`${Key}: 顔の登録に失敗`)
          errors++
        }
        
        // API制限を避けるため少し待機
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`${Key}: エラー - ${error.message}`)
        errors++
      }
    }
    
    console.log(`${venueId} 完了: ${indexedFaces}個の顔を登録, ${errors}個のエラー`)
    
    return { 
      venueId, 
      indexedFaces, 
      errors, 
      totalPhotos: photos.length
    }
    
  } catch (error) {
    console.error(`${venueId} の処理でエラー:`, error)
    return { venueId, indexedFaces: 0, errors: 1, totalPhotos: 0 }
  }
}

// メイン処理
async function main() {
  console.log('=== 会場写真の事前登録開始 ===')
  
  try {
    const config = await loadConfig()
    console.log(`S3バケット: ${config.bucketName}`)
    
    const results = []
    
    // 指定された会場のみ処理するか、全会場処理するか
    const targetVenues = process.argv[2] ? [process.argv[2]] : venues
    
    for (const venue of targetVenues) {
      const result = await preIndexVenue(venue, config)
      results.push(result)
      
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
    
  } catch (error) {
    console.error('メイン処理でエラー:', error)
    process.exit(1)
  }
}

// スクリプト実行
if (require.main === module) {
  main()
} 