import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm"

const ssmClient = new SSMClient({
  region: process.env.AWS_REGION || "ap-northeast-1",
})

interface Config {
  database_url: string
  s3_bucket: string
  rekognition_collection: string
  app_name: string
  login_password: string
  login_redirect_url: string
}

interface ParameterStoreConfig {
  database: {
    url: string
  }
  auth: {
    userCommonPassword: string
  }
  aws: {
    accessKeyId: string
    secretAccessKey: string
    s3Bucket: string
    rekognitionCollectionId: string
  }
}

let cachedConfig: Config | null = null

export async function loadConfigFromParameterStore(): Promise<Config> {
  if (cachedConfig) {
    return cachedConfig
  }

  // 環境に応じてパスを決定
  const environment = process.env.NODE_ENV === 'production' ? 'prod' : 'dev'
  const parameterPath = `/face-recognition/${environment}/config`
  
  try {
    const command = new GetParameterCommand({
      Name: parameterPath,
      WithDecryption: true,
    })

    const response = await ssmClient.send(command)
    
    if (response.Parameter?.Value) {
      const rawConfig = JSON.parse(response.Parameter.Value) as ParameterStoreConfig
      
      // Parameter Storeの構造から設定にマッピング
      cachedConfig = {
        database_url: rawConfig.database.url,
        s3_bucket: rawConfig.aws.s3Bucket,
        rekognition_collection: rawConfig.aws.rekognitionCollectionId,
        app_name: "Face Recognition System",
        login_password: rawConfig.auth.userCommonPassword,
        login_redirect_url: "/gallery/venue_01"
      }
      
      console.log(`Configuration loaded from Parameter Store: ${parameterPath}`)
      console.log(`Login password: ${cachedConfig.login_password}`)
      console.log(`S3 bucket: ${cachedConfig.s3_bucket}`)
      console.log(`Rekognition collection: ${cachedConfig.rekognition_collection}`)
      
      return cachedConfig
    } else {
      throw new Error("Parameter not found")
    }
  } catch (error) {
    console.error(`Failed to load config from Parameter Store (${parameterPath}):`, error)
    throw error
  }
}

export function getConfig(): Config {
  if (!cachedConfig) {
    throw new Error("Configuration not loaded. Call loadConfigFromParameterStore() first.")
  }
  return cachedConfig
}

// 個別のパラメータを取得する関数（Parameter Storeから動的に取得）
export async function getParameter(parameterName: string): Promise<string> {
  try {
    const command = new GetParameterCommand({
      Name: parameterName,
      WithDecryption: true,
    })

    const response = await ssmClient.send(command)
    return response.Parameter?.Value || ""
  } catch (error) {
    console.error(`Failed to get parameter ${parameterName}:`, error)
    throw error
  }
} 