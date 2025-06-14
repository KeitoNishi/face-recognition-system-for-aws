import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

// 統合設定の型定義
interface Config {
  database: {
    url: string;
  };
  auth: {
    adminUsername: string;
    adminPassword: string;
    userCommonPassword: string;
  };
  aws: {
    accessKeyId: string;
    secretAccessKey: string;
    s3Bucket: string;
    rekognitionCollectionId: string;
  };
}

let cachedConfig: Config | null = null;

export async function getConfig(): Promise<Config> {
  // キャッシュがあればそれを返す
  if (cachedConfig) {
    return cachedConfig;
  }

  const ssmClient = new SSMClient({ 
    region: process.env.AWS_REGION || 'ap-northeast-1' 
  });

  try {
    const command = new GetParameterCommand({
      Name: '/face-recognition/prod/config',
      WithDecryption: true,
    });

    const response = await ssmClient.send(command);
    
    if (!response.Parameter?.Value) {
      throw new Error('Parameter not found or empty');
    }

    const config = JSON.parse(response.Parameter.Value) as Config;
    
    // キャッシュに保存
    cachedConfig = config;
    
    return config;
  } catch (error) {
    console.error('Failed to load config from Parameter Store:', error);
    throw new Error('設定の読み込みに失敗しました');
  }
}

// 後方互換性のための個別関数
export async function getDatabaseUrl(): Promise<string> {
  const config = await getConfig();
  return config.database.url;
}

export async function getAdminCredentials(): Promise<{ username: string; password: string }> {
  const config = await getConfig();
  return {
    username: config.auth.adminUsername,
    password: config.auth.adminPassword,
  };
}

export async function getUserCommonPassword(): Promise<string> {
  const config = await getConfig();
  return config.auth.userCommonPassword;
}

export async function getAwsCredentials(): Promise<{ accessKeyId: string; secretAccessKey: string }> {
  const config = await getConfig();
  return {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  };
}

export async function getS3Bucket(): Promise<string> {
  const config = await getConfig();
  return config.aws.s3Bucket;
}

export async function getRekognitionCollectionId(): Promise<string> {
  const config = await getConfig();
  return config.aws.rekognitionCollectionId;
} 