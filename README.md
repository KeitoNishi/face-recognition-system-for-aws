# 顔認識写真管理システム

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/k-nishi-7875s-projects/v0--2y)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/6JMeOWb84Zw)

## Overview

This repository will stay in sync with your deployed chats on [v0.dev](https://v0.dev).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.dev](https://v0.dev).

## Deployment

Your project is live at:

**[https://vercel.com/k-nishi-7875s-projects/v0--2y](https://vercel.com/k-nishi-7875s-projects/v0--2y)**

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/6JMeOWb84Zw](https://v0.dev/chat/projects/6JMeOWb84Zw)**

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## AWS Parameter Store（JSON一括）設定例

1. AWSコンソールで下記のようなJSONをSecureStringで `/face-recognition/prod/config` という名前で登録

```
{
  "databaseUrl": "postgresql://postgres:パスワード@エンドポイント:5432/face_recognition_db",
  "awsAccessKey": "AKIA...",
  "awsSecretKey": "xxxx",
  "s3Bucket": "face-recognition-system-images-gakkai",
  "rekognitionCollectionId": "face-recognition-system",
  "userCommonPassword": "xxxxxx",
  "adminUsername": "admin",
  "adminPassword": "xxxxxx"
}
```

2. ソースコードは `lib/aws.ts`, `lib/db.ts`, `lib/auth.ts` などで `getConfig()` を通じて値を取得します。