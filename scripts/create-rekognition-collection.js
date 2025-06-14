import { RekognitionClient, CreateCollectionCommand, ListCollectionsCommand } from "@aws-sdk/client-rekognition"
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm"

async function getConfig() {
  const ssm = new SSMClient({ region: "ap-northeast-1" })
  const command = new GetParameterCommand({
    Name: "/face-recognition/prod/config",
    WithDecryption: true,
  })
  const response = await ssm.send(command)
  if (!response.Parameter?.Value) throw new Error("Config not found")
  return JSON.parse(response.Parameter.Value)
}

async function createCollection() {
  const config = await getConfig()
  const region = "ap-northeast-1"
  const rekognitionClient = new RekognitionClient({
    region,
    credentials: {
      accessKeyId: config.awsAccessKey,
      secretAccessKey: config.awsSecretKey,
    },
  })
  const collectionId = config.rekognitionCollectionId

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
