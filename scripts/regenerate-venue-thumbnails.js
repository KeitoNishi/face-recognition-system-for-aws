const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm')
const { S3Client, ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3')
const sharp = require('sharp')

// AWS設定
const region = process.env.AWS_REGION || 'ap-northeast-1'
const ssmClient = new SSMClient({ region })
const s3Client = new S3Client({ region })

// Parameter Storeから設定を取得
async function loadConfigFromParameterStore() {
  try {
    // 環境に応じてパスを決定
    const environment = process.env.NODE_ENV === 'production' ? 'prod' : 'dev'
    const parameterPath = `/face-recognition/${environment}/config`
    
    const command = new GetParameterCommand({
      Name: parameterPath,
      WithDecryption: true,
    })
    const response = await ssmClient.send(command)
    
    if (response.Parameter?.Value) {
      const rawConfig = JSON.parse(response.Parameter.Value)
      
      // Parameter Storeの構造から設定にマッピング
      const config = {
        database_url: rawConfig.database.url,
        s3_bucket: rawConfig.aws.s3Bucket,
        rekognition_collection: rawConfig.aws.rekognitionCollectionId,
        app_name: "Face Recognition System",
        login_password: rawConfig.auth.userCommonPassword,
        login_redirect_url: "/"
      }
      
      console.log(`Configuration loaded from Parameter Store: ${parameterPath}`)
      console.log(`S3 bucket: ${config.s3_bucket}`)
      console.log(`Rekognition collection: ${config.rekognition_collection}`)
      
      return config
    } else {
      throw new Error("Parameter not found")
    }
  } catch (error) {
    console.error('Parameter Store設定取得エラー:', error)
    throw error
  }
}

// S3から全キーを取得
async function listAllKeys(bucket, prefix) {
  const keys = []
  let token
  do {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      ContinuationToken: token
    })
    const out = await s3Client.send(command)
    if (out.Contents) {
      keys.push(...out.Contents.map(obj => obj.Key))
    }
    token = out.NextContinuationToken
  } while (token)
  return keys
}

// 画像ファイルかどうか判定
function isImageFile(key) {
  const ext = key.toLowerCase().split('.').pop()
  return ['jpg', 'jpeg', 'png', 'gif'].includes(ext)
}

// サムネイル生成
async function generateThumbnail(bucket, originalKey, thumbnailKey, width) {
  try {
    // 元画像を取得
    const getCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: originalKey
    })
    const originalObj = await s3Client.send(getCommand)
    const originalBuffer = Buffer.from(await originalObj.Body.transformToByteArray())
    
    // Sharpでサムネイル生成（EXIF情報のOrientationタグを自動処理）
    const thumbnailBuffer = await sharp(originalBuffer)
      .rotate() // EXIF情報に基づいて自動回転
      .resize(width, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      })
      .jpeg({ quality: 85 })
      .toBuffer()

    // サムネイルをS3に保存
    const putCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: thumbnailKey,
      Body: thumbnailBuffer,
      ContentType: 'image/jpeg',
      CacheControl: 'public, max-age=31536000, immutable',
    })
    await s3Client.send(putCommand)
    
    return true
  } catch (error) {
    console.error(`サムネイル生成エラー (${originalKey}):`, error)
    return false
  }
}

async function main() {
  const venueId = process.argv[2]
  
  if (!venueId) {
    console.error('使用方法: node scripts/regenerate-venue-thumbnails.js <venue_id>')
    console.error('例: node scripts/regenerate-venue-thumbnails.js venue_02')
    process.exit(1)
  }

  try {
    console.log(`=== ${venueId} のサムネイル再生成開始 ===`)
    console.log(`開始時刻: ${new Date().toISOString()}`)
    
    // 設定を取得
    const config = await loadConfigFromParameterStore()
    const bucket = config.s3_bucket
    
    console.log(`対象バケット: ${bucket}`)
    console.log(`対象会場: ${venueId}`)
    
    // 1. 元画像一覧を取得
    console.log('\n1️⃣ 元画像一覧取得中...')
    const originalPrefix = `venues/${venueId}/`
    const originalKeys = await listAllKeys(bucket, originalPrefix)
    const imageKeys = originalKeys.filter(isImageFile)
    
    console.log(`元画像数: ${imageKeys.length}枚`)
    
    // 2. 既存サムネイル一覧を取得
    console.log('\n2️⃣ 既存サムネイル一覧取得中...')
    const thumbnailPrefix = `thumbnails/${venueId}/`
    const existingThumbnailKeys = await listAllKeys(bucket, thumbnailPrefix)
    
    console.log(`既存サムネイル数: ${existingThumbnailKeys.length}枚`)
    
    // 3. 既存サムネイルを削除
    console.log('\n3️⃣ 既存サムネイル削除中...')
    let deletedCount = 0
    for (const thumbnailKey of existingThumbnailKeys) {
      try {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: bucket,
          Key: thumbnailKey
        })
        await s3Client.send(deleteCommand)
        deletedCount++
        process.stdout.write('.')
      } catch (error) {
        console.error(`\n削除エラー (${thumbnailKey}):`, error)
      }
    }
    console.log(`\n削除完了: ${deletedCount}枚`)
    
    // 4. 新しいサムネイルを生成
    console.log('\n4️⃣ 新しいサムネイル生成中...')
    const allowedWidths = [320, 480, 640]
    let generatedCount = 0
    let errorCount = 0
    
    for (const originalKey of imageKeys) {
      const filename = originalKey.split('/').pop() || ''
      const baseName = filename.replace(/\.[^/.]+$/, '')
      
      for (const width of allowedWidths) {
        const thumbnailKey = `thumbnails/${venueId}/${baseName}_${width}.jpg`
        
        const success = await generateThumbnail(bucket, originalKey, thumbnailKey, width)
        if (success) {
          generatedCount++
          process.stdout.write('.')
        } else {
          errorCount++
          process.stdout.write('x')
        }
      }
    }
    
    console.log(`\n生成完了: ${generatedCount}枚`)
    if (errorCount > 0) {
      console.log(`エラー: ${errorCount}枚`)
    }
    
    // 5. 最終確認
    console.log('\n5️⃣ 最終確認中...')
    const finalThumbnailKeys = await listAllKeys(bucket, thumbnailPrefix)
    console.log(`最終サムネイル数: ${finalThumbnailKeys.length}枚`)
    
    console.log('\n=== サムネイル再生成完了 ===')
    console.log(`完了時刻: ${new Date().toISOString()}`)
    console.log(`\n🎉 ${venueId} のサムネイル再生成が正常に完了しました！`)
    console.log(`\n次のステップ:`)
    console.log(`1. ${venueId} の写真一覧表示を確認`)
    console.log(`2. サムネイルの向きが正しく表示されることを確認`)
    
  } catch (error) {
    console.error('サムネイル再生成エラー:', error)
    process.exit(1)
  }
}

main() 