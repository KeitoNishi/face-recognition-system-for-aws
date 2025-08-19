const { RekognitionClient, SearchFacesByImageCommand } = require('@aws-sdk/client-rekognition')
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3')
const fs = require('fs')
const path = require('path')

// AWS設定
const region = process.env.AWS_REGION || 'ap-northeast-1'
const rekog = new RekognitionClient({ region })
const s3 = new S3Client({ region })

// 会場別コレクションIDを解決
const resolveVenueCollection = (venueId) => {
  const prefix = process.env.REKOG_COLLECTION_PREFIX || 'face-recognition'
  return `${prefix}-${venueId}`
}

// テスト用の顔画像を読み込み
function loadTestImage() {
  const testImagePath = path.join(__dirname, '../public/images/test-face.jpg')
  if (fs.existsSync(testImagePath)) {
    return fs.readFileSync(testImagePath)
  } else {
    console.error('テスト用画像が見つかりません:', testImagePath)
    process.exit(1)
  }
}

// 爆速絞り込みテスト
async function testEfficientFilter(venueId, testImageBytes) {
  console.log(`\n=== ${venueId} の爆速絞り込みテスト ===`)
  
  const collection = resolveVenueCollection(venueId)
  const fallback = process.env.REKOG_FALLBACK_COLLECTION
  
  console.log(`対象コレクション: ${collection}`)
  console.log(`フォールバックコレクション: ${fallback || 'なし'}`)
  
  const tries = [
    { th: 90, top: 20, name: 'Ultra-fast (90%)' },
    { th: 85, top: 50, name: 'Fast (85%)' },
    { th: 80, top: 100, name: 'Standard (80%)' }
  ]

  const collections = [collection, fallback].filter(Boolean)

  for (const cid of collections) {
    console.log(`\nコレクション ${cid} で検索中...`)
    
    for (const t of tries) {
      console.log(`  ${t.name} で検索中...`)
      
      try {
        const startTime = Date.now()
        
        const res = await rekog.send(new SearchFacesByImageCommand({
          CollectionId: cid,
          Image: { Bytes: testImageBytes },
          FaceMatchThreshold: t.th,
          MaxFaces: t.top
        }))
        
        const endTime = Date.now()
        const processingTime = endTime - startTime
        
        const matches = res.FaceMatches || []
        
        if (matches.length > 0) {
          console.log(`    ✅ マッチ発見: ${matches.length}件 (${processingTime}ms)`)
          
          matches.forEach((match, index) => {
            const extId = match.Face?.ExternalImageId || 'Unknown'
            const similarity = match.Similarity || 0
            console.log(`      ${index + 1}. ${extId} (類似度: ${similarity.toFixed(1)}%)`)
          })
          
          return {
            success: true,
            collection: cid,
            threshold: t.th,
            matches: matches.length,
            processingTime,
            results: matches
          }
        } else {
          console.log(`    ❌ マッチなし (${processingTime}ms)`)
        }
        
      } catch (error) {
        console.log(`    ❌ エラー: ${error.message}`)
      }
    }
  }
  
  return {
    success: false,
    message: 'どのコレクションでもマッチしませんでした'
  }
}

// メイン処理
async function main() {
  console.log('=== 爆速絞り込み機能テスト ===')
  
  const venueId = process.argv[2] || 'venue_01'
  console.log(`テスト対象会場: ${venueId}`)
  
  try {
    // テスト用画像を読み込み
    const testImageBytes = loadTestImage()
    console.log(`テスト画像サイズ: ${(testImageBytes.length / 1024).toFixed(1)}KB`)
    
    // 爆速絞り込みテスト実行
    const result = await testEfficientFilter(venueId, testImageBytes)
    
    if (result.success) {
      console.log(`\n✅ テスト成功！`)
      console.log(`コレクション: ${result.collection}`)
      console.log(`閾値: ${result.threshold}%`)
      console.log(`マッチ数: ${result.matches}件`)
      console.log(`処理時間: ${result.processingTime}ms`)
    } else {
      console.log(`\n❌ テスト失敗: ${result.message}`)
    }
    
  } catch (error) {
    console.error('テスト実行エラー:', error)
    process.exit(1)
  }
}

// スクリプト実行
if (require.main === module) {
  main()
} 