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
- 顔認識による写真絞り込み機能
- レスポンシブデザイン
- モーダル表示による写真詳細表示
- 写真ダウンロード機能

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
```

3. 開発サーバーの起動
```bash
npm run dev
```

4. ブラウザで http://localhost:3000 にアクセス

### パスワード

- テスト用パスワード: `venue_01`

## 本番環境デプロイ

### EC2での実行

1. プロジェクトをEC2に転送
2. 依存関係をインストール
```bash
npm install
```

3. ビルド
```bash
npm run build
```

4. アプリケーション起動
```bash
npm start
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
├── gallery/
│   └── venue_01/
│       ├── 0001.jpg
│       ├── 0002.jpg
│       └── ...
```

## ライセンス

© 2025- The 129th Annual Meeting of the Japanese Ophthalmological Society.