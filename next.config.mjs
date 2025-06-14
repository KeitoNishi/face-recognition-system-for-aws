import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm"

// Parameter Storeから設定を読み込む関数
async function loadConfigFromParameterStore() {
  try {
    const ssmClient = new SSMClient({
      region: process.env.AWS_REGION || "ap-northeast-1",
    })

    const command = new GetParameterCommand({
      Name: "/face-recognition/prod/config",
      WithDecryption: true,
    })

    const response = await ssmClient.send(command)
    const config = JSON.parse(response.Parameter?.Value || "{}")

    // 環境変数に設定
    process.env.DATABASE_URL = config.database?.url
    process.env.ADMIN_USERNAME = config.auth?.adminUsername
    process.env.ADMIN_PASSWORD = config.auth?.adminPassword
    process.env.USER_PASSWORD = config.auth?.userCommonPassword
    process.env.AWS_ACCESS_KEY_ID = config.aws?.accessKeyId
    process.env.AWS_SECRET_ACCESS_KEY = config.aws?.secretAccessKey
    process.env.S3_BUCKET_NAME = config.aws?.s3Bucket
    process.env.REKOGNITION_COLLECTION_ID = config.aws?.rekognitionCollectionId

    console.log("Configuration loaded from Parameter Store at startup")
  } catch (error) {
    console.error("Failed to load configuration from Parameter Store:", error)
  }
}

// アプリ起動時に設定を読み込み
await loadConfigFromParameterStore()

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig