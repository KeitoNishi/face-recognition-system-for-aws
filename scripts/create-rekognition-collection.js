const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm')
const { RekognitionClient, CreateCollectionCommand, ListCollectionsCommand } = require('@aws-sdk/client-rekognition')

// AWS設定
const region = process.env.AWS_REGION || 'ap-northeast-1'
const ssmClient = new SSMClient({ region })
const rekognitionClient = new RekognitionClient({ region })

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
      collectionId: config.aws?.rekognitionCollectionId || 'face-recognition-collection'
    }
  } catch (error) {
    console.error('設定の取得に失敗:', error)
    throw error
  }
}

// コレクション一覧を取得
async function listCollections() {
  try {
    const command = new ListCollectionsCommand({})
    const response = await rekognitionClient.send(command)
    return response.CollectionIds || []
  } catch (error) {
    console.error('コレクション一覧取得エラー:', error)
    return []
  }
}

// コレクションを作成
async function createCollection(collectionId) {
  try {
    const command = new CreateCollectionCommand({
      CollectionId: collectionId
    })
    
    const response = await rekognitionClient.send(command)
    return response
  } catch (error) {
    console.error('コレクション作成エラー:', error)
    throw error
  }
}

// メイン処理
async function main() {
  console.log('=== Rekognitionコレクション作成開始 ===')
  
  try {
    // 設定を取得
    const config = await loadConfig()
    const collectionId = config.collectionId
    
    console.log(`コレクションID: ${collectionId}`)
    console.log(`リージョン: ${region}`)
    
    // 既存のコレクション一覧を確認
    console.log('\n既存のコレクション一覧:')
    const existingCollections = await listCollections()
    
    if (existingCollections.length === 0) {
      console.log('コレクションが存在しません')
    } else {
      existingCollections.forEach(id => {
        console.log(`- ${id}`)
      })
    }
    
    // コレクションが既に存在するかチェック
    if (existingCollections.includes(collectionId)) {
      console.log(`\n✅ コレクション "${collectionId}" は既に存在します`)
      return
    }
    
    // コレクションを作成
    console.log(`\nコレクション "${collectionId}" を作成中...`)
    const result = await createCollection(collectionId)
    
    console.log('✅ コレクション作成完了')
    console.log(`ステータスコード: ${result.StatusCode}`)
    console.log(`ARN: ${result.CollectionArn}`)
    
    // 作成後のコレクション一覧を確認
    console.log('\n更新後のコレクション一覧:')
    const updatedCollections = await listCollections()
    updatedCollections.forEach(id => {
      console.log(`- ${id}`)
    })
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    process.exit(1)
  }
}

// スクリプト実行
if (require.main === module) {
  main()
} 