# 🔐 Parameter Store 完全設定ガイド

## 📋 **Parameter Store とは**

AWS Systems Manager Parameter Store は、アプリケーションの設定データや機密情報を安全に管理するサービスです。本システムでは、データベース接続情報、AWS認証情報、アプリケーション設定を一元管理しています。

## 🗂️ **設定項目詳細**

### **必須パラメータ一覧**

| パラメータ | 説明 | 使用箇所 | サンプル値 |
|------------|------|----------|------------|
| `databaseUrl` | PostgreSQL接続URL | `lib/db.ts` | `postgresql://user:pass@host:5432/db` |
| `awsAccessKey` | AWS APIアクセスキー | `lib/aws.ts` | `AKIA1234567890ABCDEF` |
| `awsSecretKey` | AWS APIシークレットキー | `lib/aws.ts` | `abcdefghijklmnopqrstuvwxyz1234567890ABCD` |
| `s3Bucket` | S3バケット名 | `lib/aws.ts` | `face-recognition-photos` |
| `rekognitionCollectionId` | Rekognitionコレクション名 | `lib/aws.ts` | `face-recognition-system` |
| `userCommonPassword` | 一般ユーザー共通パスワード | `lib/auth.ts` | `test2024` |
| `adminUsername` | 管理者ユーザー名 | `lib/auth.ts` | `admin` |
| `adminPassword` | 管理者パスワード | `lib/auth.ts` | `admin2024` |

## 🔧 **Parameter Store設定手順**

### **1. AWSコンソールでの設定**

```bash
# AWSコンソールにログイン
https://ap-northeast-1.console.aws.amazon.com/systems-manager/parameters/

# 新しいパラメータを作成
名前: /face-recognition/prod/config
説明: 顔認識システム設定（本番環境）
階層: Standard
タイプ: SecureString
KMSキー: alias/aws/ssm（デフォルト）
値: 下記JSON参照
```

### **2. JSON設定値**

```json
{
  "databaseUrl": "postgresql://face_recognition_user:YOUR_PASSWORD@face-recognition-db.c0g12z1wxn1k.ap-northeast-1.rds.amazonaws.com:5432/face_recognition_db",
  "awsAccessKey": "AKIA1234567890ABCDEF",
  "awsSecretKey": "abcdefghijklmnopqrstuvwxyz1234567890ABCD",
  "s3Bucket": "face-recognition-system-images-gakkai",
  "rekognitionCollectionId": "face-recognition-system",
  "userCommonPassword": "test2024",
  "adminUsername": "admin",
  "adminPassword": "admin2024"
}
```

### **3. AWS CLI での設定**

```bash
# Parameter Store にJSONを設定
aws ssm put-parameter \
  --name "/face-recognition/prod/config" \
  --description "顔認識システム本番設定" \
  --type "SecureString" \
  --value '{
    "databaseUrl": "postgresql://face_recognition_user:YOUR_PASSWORD@face-recognition-db.c0g12z1wxn1k.ap-northeast-1.rds.amazonaws.com:5432/face_recognition_db",
    "awsAccessKey": "AKIA1234567890ABCDEF",
    "awsSecretKey": "abcdefghijklmnopqrstuvwxyz1234567890ABCD",
    "s3Bucket": "face-recognition-system-images-gakkai",
    "rekognitionCollectionId": "face-recognition-system",
    "userCommonPassword": "test2024",
    "adminUsername": "admin",
    "adminPassword": "admin2024"
  }' \
  --region ap-northeast-1
```

## 🎯 **コード内での使用箇所**

### **1. データベース接続（lib/db.ts）**

```typescript
// 39-54:lib/db.ts
async function getConfig() {
  if (configCache) return configCache;
  const command = new GetParameterCommand({
    Name: "/face-recognition/prod/config",  // ← Parameter Store パス
    WithDecryption: true,                   // ← SecureString復号化
  });
  const response = await ssm.send(command);
  if (!response.Parameter?.Value) throw new Error("Config not found");
  configCache = JSON.parse(response.Parameter.Value);  // ← JSON解析
  return configCache;
}

export async function getDb() {
  if (sql) return sql;
  const config = await getConfig();
  sql = postgres(config.databaseUrl, {     // ← databaseUrl使用
    ssl: process.env.NODE_ENV === "production" ? "require" : false,
  });
  return sql;
}
```

**使用タイミング**: データベースアクセス時（アプリ起動時、API呼び出し時）

### **2. AWS S3/Rekognition接続（lib/aws.ts）**

```typescript
// 71-86:lib/aws.ts
export async function getAwsClients() {
  const config = await getConfig();
  const s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId: config.awsAccessKey,      // ← awsAccessKey使用
      secretAccessKey: config.awsSecretKey,  // ← awsSecretKey使用
    },
  });
  const rekognitionClient = new RekognitionClient({
    region,
    credentials: {
      accessKeyId: config.awsAccessKey,      // ← awsAccessKey使用
      secretAccessKey: config.awsSecretKey,  // ← awsSecretKey使用
    },
  });
  return {
    s3Client,
    rekognitionClient,
    bucketName: config.s3Bucket,                        // ← s3Bucket使用
    collectionId: config.rekognitionCollectionId,       // ← rekognitionCollectionId使用
    region,
  };
}
```

**使用タイミング**: 写真アップロード時、顔認識処理時、署名付きURL生成時

### **3. 認証処理（lib/auth.ts）**

```typescript
// 56-67:lib/auth.ts
// 管理者用ベーシック認証
export async function isAdminAuthenticatedAsync(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return false
  }
  const base64Credentials = authHeader.split(" ")[1]
  const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8")
  const [username, password] = credentials.split(":")
  const config = await getConfig()
  return username === config.adminUsername && password === config.adminPassword  // ← 管理者認証情報使用
}

// ユーザー認証（共通パスワード）
export async function validateUserPasswordAsync(password: string) {
  const config = await getConfig()
  return password === config.userCommonPassword  // ← userCommonPassword使用
}
```

**使用タイミング**: ログイン時（管理者・一般ユーザー）

## 🌍 **環境別設定**

### **開発環境**
```
パラメータ名: /face-recognition/dev/config
目的: 開発・テスト用設定
特徴: ローカルDB、テスト用認証情報
```

### **ステージング環境**
```
パラメータ名: /face-recognition/staging/config
目的: 本番前検証用設定
特徴: 本番相当の設定、テストデータ
```

### **本番環境**
```
パラメータ名: /face-recognition/prod/config
目的: 実際の本番サービス用設定
特徴: 本番DB、本番AWS認証情報
```

### **顧客環境**
```
パラメータ名: /face-recognition/[顧客名]/prod/config
目的: 顧客専用環境設定
特徴: 顧客専用リソース、独立したDB/S3
```

## 🔄 **動的設定変更対応**

### **環境変数での設定パス変更**

```typescript
// lib/ssm.ts
const region = process.env.AWS_REGION || "ap-northeast-1";
const configPath = process.env.CONFIG_PATH || "/face-recognition/prod/config";  // ← 環境変数で設定パス変更可能
```

### **顧客環境デプロイ時の設定例**

```bash
# 環境変数設定
export AWS_REGION="ap-northeast-1"
export CONFIG_PATH="/face-recognition/customer-a/prod/config"

# アプリ起動
npm start
```

## 🛡️ **セキュリティ考慮事項**

### **IAMポリシー設定**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter"
      ],
      "Resource": [
        "arn:aws:ssm:ap-northeast-1:123456789012:parameter/face-recognition/*"
      ]
    }
  ]
}
```

### **Parameter Store アクセス制御**

1. **リソースベースアクセス制御**: Parameter Storeパスで制限
2. **暗号化**: SecureStringで自動暗号化
3. **監査ログ**: CloudTrailでアクセス記録
4. **バージョン管理**: Parameter Store履歴管理

## 📊 **監視・トラブルシューティング**

### **設定確認コマンド**

```bash
# Parameter Store値確認
aws ssm get-parameter \
  --name "/face-recognition/prod/config" \
  --with-decryption \
  --region ap-northeast-1

# 設定履歴確認
aws ssm get-parameter-history \
  --name "/face-recognition/prod/config" \
  --region ap-northeast-1
```

### **よくあるエラー**

#### **1. Parameter not found**
```
エラー: Config not found
原因: Parameter Storeパスが間違っている
解決: パス確認、権限確認
```

#### **2. Access Denied**
```
エラー: The user is not authorized to perform: ssm:GetParameter
原因: IAMロールに権限がない
解決: IAMポリシー追加
```

#### **3. Decryption Error**
```
エラー: ParameterDecryptionFailure
原因: KMSキーへのアクセス権限がない
解決: KMSポリシー確認
```

## 🔧 **設定更新手順**

### **1. 設定値の更新**

```bash
# 新しい設定値で更新
aws ssm put-parameter \
  --name "/face-recognition/prod/config" \
  --value '更新されたJSON' \
  --type "SecureString" \
  --overwrite \
  --region ap-northeast-1
```

### **2. アプリケーション再起動**

```bash
# PM2再起動（設定キャッシュクリア）
pm2 restart face-recognition-app
```

### **3. 設定反映確認**

```bash
# ログで設定ロード確認
pm2 logs face-recognition-app
```

## 💰 **コスト考慮**

### **Parameter Store料金**

- **Standard Parameters**: 月額$0.05 per 10,000 API calls
- **Advanced Parameters**: 月額$0.05 per 10,000 API calls + $0.05 per parameter per month
- **本システム**: Standard で十分（月額数円程度）

### **最適化方法**

1. **設定キャッシュ**: アプリ内でキャッシュして API 呼び出し削減
2. **環境統合**: 可能な限り設定を統合
3. **監視設定**: 不要な API 呼び出しを監視

---

## 📞 **サポート情報**

Parameter Store設定でご不明な点がございましたら、以下の情報をお知らせください：

1. **設定パス**: `/face-recognition/[環境]/config`
2. **エラーメッセージ**: 詳細なエラー内容
3. **IAMロール**: EC2にアタッチされているロール名
4. **AWSリージョン**: 設定されているリージョン 