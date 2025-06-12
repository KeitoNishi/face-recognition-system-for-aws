import { RekognitionClient, CreateCollectionCommand, ListCollectionsCommand } from "@aws-sdk/client-rekognition"

// AWS設定
const region = process.env.AWS_REGION || "ap-northeast-1"
const rekognitionClient = new RekognitionClient({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const collectionId = process.env.REKOGNITION_COLLECTION_ID || "face-recognition-system"

async function createCollection() {
  try {
    // 既存のコレクションを確認
    const listCommand = new ListCollectionsCommand({})
    const collections = await rekognitionClient.send(listCommand)

    if (collections.CollectionIds && collections.CollectionIds.includes(collectionId)) {
      console.log(`コレクション "${collectionId}" は既に存在します`)
      return
    }

    // コレクションを作成
    const createCommand = new CreateCollectionCommand({
      CollectionId: collectionId,
    })

    const response = await rekognitionClient.send(createCommand)
    console.log(`コレクション "${collectionId}" を作成しました:`, response)
  } catch (error) {
    console.error("コレクション作成エラー:", error)
  }
}

createCollection()
