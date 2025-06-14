import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import {
  RekognitionClient,
  IndexFacesCommand,
  SearchFacesByImageCommand,
  DetectFacesCommand,
} from "@aws-sdk/client-rekognition"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { getConfig } from "@/lib/ssm"

const region = process.env.AWS_REGION || "ap-northeast-1";

// AWS設定
export async function getAwsClients() {
  const config = await getConfig();
  const s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId: config.awsAccessKey,
      secretAccessKey: config.awsSecretKey,
    },
  });
  const rekognitionClient = new RekognitionClient({
    region,
    credentials: {
      accessKeyId: config.awsAccessKey,
      secretAccessKey: config.awsSecretKey,
    },
  });
  return {
    s3Client,
    rekognitionClient,
    bucketName: config.s3Bucket,
    collectionId: config.rekognitionCollectionId,
    region,
  };
}

// S3に写真をアップロード
export async function uploadPhotoToS3(file: Buffer, key: string, contentType: string) {
  const config = await getConfig();
  const s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId: config.awsAccessKey,
      secretAccessKey: config.awsSecretKey,
    },
  });
  const command = new PutObjectCommand({
    Bucket: config.s3Bucket,
    Key: key,
    Body: file,
    ContentType: contentType,
  });
  await s3Client.send(command);
  return `https://${config.s3Bucket}.s3.${region}.amazonaws.com/${key}`;
}

// S3から写真の署名付きURLを取得
export async function getSignedPhotoUrl(key: string) {
  const config = await getConfig();
  const s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId: config.awsAccessKey,
      secretAccessKey: config.awsSecretKey,
    },
  });
  const command = new GetObjectCommand({
    Bucket: config.s3Bucket,
    Key: key,
  });
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

// 顔を登録
export async function indexFace(imageBuffer: Buffer) {
  const config = await getConfig();
  const rekognitionClient = new RekognitionClient({
    region,
    credentials: {
      accessKeyId: config.awsAccessKey,
      secretAccessKey: config.awsSecretKey,
    },
  });
  const command = new IndexFacesCommand({
    CollectionId: config.rekognitionCollectionId,
    Image: {
      Bytes: new Uint8Array(imageBuffer),
    },
    DetectionAttributes: ["ALL"],
  });
  const response = await rekognitionClient.send(command);
  if (response.FaceRecords && response.FaceRecords.length > 0) {
    return response.FaceRecords[0].Face?.FaceId;
  }
  throw new Error("顔を検出できませんでした");
}

// 顔が含まれているか確認
export async function detectFaces(imageBuffer: Buffer) {
  const config = await getConfig();
  const rekognitionClient = new RekognitionClient({
    region,
    credentials: {
      accessKeyId: config.awsAccessKey,
      secretAccessKey: config.awsSecretKey,
    },
  });
  const command = new DetectFacesCommand({
    Image: {
      Bytes: new Uint8Array(imageBuffer),
    },
  });
  const response = await rekognitionClient.send(command);
  return response.FaceDetails && response.FaceDetails.length > 0;
}

// 顔で写真を検索
export async function searchFacesByImage(imageBuffer: Buffer) {
  const config = await getConfig();
  const rekognitionClient = new RekognitionClient({
    region,
    credentials: {
      accessKeyId: config.awsAccessKey,
      secretAccessKey: config.awsSecretKey,
    },
  });
  const command = new SearchFacesByImageCommand({
    CollectionId: config.rekognitionCollectionId,
    Image: {
      Bytes: new Uint8Array(imageBuffer),
    },
    MaxFaces: 10,
    FaceMatchThreshold: 90,
  });
  const response = await rekognitionClient.send(command);
  return response.FaceMatches || [];
}
