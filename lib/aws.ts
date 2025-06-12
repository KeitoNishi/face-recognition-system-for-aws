import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import {
  RekognitionClient,
  IndexFacesCommand,
  SearchFacesByImageCommand,
  DetectFacesCommand,
} from "@aws-sdk/client-rekognition"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

// AWS設定
const region = process.env.AWS_REGION || "ap-northeast-1"
const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const rekognitionClient = new RekognitionClient({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const bucketName = process.env.S3_BUCKET_NAME!
const collectionId = process.env.REKOGNITION_COLLECTION_ID!

// S3に写真をアップロード
export async function uploadPhotoToS3(file: Buffer, key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: file,
    ContentType: contentType,
  })

  await s3Client.send(command)
  return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`
}

// S3から写真の署名付きURLを取得
export async function getSignedPhotoUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  })

  // 1時間有効な署名付きURL
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 })
}

// 顔を登録
export async function indexFace(imageBuffer: Buffer) {
  const command = new IndexFacesCommand({
    CollectionId: collectionId,
    Image: {
      Bytes: imageBuffer,
    },
    DetectionAttributes: ["ALL"],
  })

  const response = await rekognitionClient.send(command)
  if (response.FaceRecords && response.FaceRecords.length > 0) {
    return response.FaceRecords[0].Face?.FaceId
  }
  throw new Error("顔を検出できませんでした")
}

// 顔が含まれているか確認
export async function detectFaces(imageBuffer: Buffer) {
  const command = new DetectFacesCommand({
    Image: {
      Bytes: imageBuffer,
    },
  })

  const response = await rekognitionClient.send(command)
  return response.FaceDetails && response.FaceDetails.length > 0
}

// 顔で写真を検索
export async function searchFacesByImage(imageBuffer: Buffer, maxResults = 100) {
  const command = new SearchFacesByImageCommand({
    CollectionId: collectionId,
    Image: {
      Bytes: imageBuffer,
    },
    MaxFaces: maxResults,
    FaceMatchThreshold: 80, // 類似度のしきい値（0-100）
  })

  try {
    const response = await rekognitionClient.send(command)
    return response.FaceMatches || []
  } catch (error) {
    console.error("顔検索エラー:", error)
    return []
  }
}
