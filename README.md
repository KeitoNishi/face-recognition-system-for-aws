# 顔認識フォトギャラリー

第129回日本眼科学会総会の顔認識機能付きフォトギャラリーです。

## 技術スタック

- **フロントエンド**: Next.js 15, React 19, TypeScript
- **AWS サービス**: 
  - Parameter Store (設定管理)
  - S3 (画像ストレージ)
  - Rekognition (顔認識)
  - EC2 (アプリケーションサーバー)

## 機能

- パスワード認証によるギャラリーアクセス
- **爆速絞り込み機能**（会場別コレクション + Bytes直送）
- レスポンシブデザイン
- モーダル表示による写真詳細表示
- 写真ダウンロード機能

## 爆速絞り込み機能

### 最適化内容

1. **会場別コレクション検索**: 各会場専用のRekognitionコレクション
2. **ExternalImageId=S3キー**: マッピング不要で直接S3キー取得
3. **Bytes直送**: S3参照のRTT削減
4. **Keep-Alive最適化**: AWS SDK v3での接続再利用
5. **S3ページネーション対応**: 1000件超の全件取得

### 環境変数設定

```bash
# AWS設定
AWS_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# S3設定
S3_BUCKET_NAME=face-recognition-system-bucket

# Rekognition設定
REKOGNITION_COLLECTION_ID=face-recognition-collection
REKOG_COLLECTION_PREFIX=face-recognition        # 新規: 会場別に接頭辞
REKOG_FALLBACK_COLLECTION=face-recognition-collection  # 旧グローバル（移行期間のみ）
```

## ローカル開発

### 前提条件

- Node.js 18以上
- AWS CLI設定済み
- 適切なIAMロール設定

### セットアップ

1. 依存関係のインストール
```bash
npm install
```

2. 環境変数の設定
```bash
export AWS_REGION=ap-northeast-1
export S3_BUCKET_NAME=your-bucket-name
export REKOG_COLLECTION_PREFIX=face-recognition
export REKOG_FALLBACK_COLLECTION=face-recognition-collection
```

3. 開発サーバーの起動
```bash
npm run dev
```

4. ブラウザで http://localhost:3000 にアクセス

### パスワード

- テスト用パスワード: `venue_01`

## 本番環境デプロイ

### 前提条件

- EC2インスタンス（Amazon Linux 2推奨）
- Node.js 18以上
- PM2（プロセス管理）
- Nginx（リバースプロキシ）
- AWS IAMロール設定済み

### EC2での実行

1. プロジェクトをEC2に転送
```bash
# ローカルから転送
scp -r . ec2-user@your-ec2-ip:/home/ec2-user/face-recognition-system
```

2. 依存関係をインストール
```bash
cd /home/ec2-user/face-recognition-system
npm install --production
```

3. 本番環境ビルド
```bash
npm run build:prod
```

4. PM2でアプリケーション起動
```bash
# PM2インストール（初回のみ）
npm install -g pm2

# アプリケーション起動
pm2 start npm --name "face-recognition" -- start:prod

# 自動起動設定
pm2 startup
pm2 save
```

### 本番環境設定

#### Parameter Store設定
```json
{
  "database": {
    "url": "postgresql://username:password@host:port/database"
  },
  "auth": {
    "adminUsername": "admin",
    "adminPassword": "secure_password",
    "userCommonPassword": "common_user_password"
  },
  "aws": {
    "accessKeyId": "your_access_key_id",
    "secretAccessKey": "your_secret_access_key",
    "s3Bucket": "your-s3-bucket-name",
    "rekognitionCollectionId": "your-collection-id"
  }
}
```

#### Nginx設定例
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 監視とログ

```bash
# PM2ログ確認
pm2 logs face-recognition

# プロセス状態確認
pm2 status

# アプリケーション再起動
pm2 restart face-recognition
```

### PM2での管理（推奨）

```bash
npm install -g pm2
pm2 start npm --name "face-gallery" -- start
pm2 save
pm2 startup
```

## 設定

### Parameter Store設定

以下のパラメータを設定してください：

- `/face-recognition/collection-id`: RekognitionコレクションID
- `/face-recognition/bucket-name`: S3バケット名

### S3バケット構造

```
bucket-name/
├── venues/
│   └── venue_01/
│       ├── 0001.jpg
│       ├── 0002.jpg
│       └── ...
```

### 会場別コレクション作成

```bash
# 特定会場の再インデックス
node scripts/pre-index-venue-photos.js venue_01

# 全会場の再インデックス
node scripts/pre-index-venue-photos.js
```

## ライセンス

© 2025- The 129th Annual Meeting of the Japanese Ophthalmological Society.