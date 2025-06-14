# 🏢 顧客環境デプロイメントガイド

## 📋 **事前準備チェックリスト**

### **1. AWS環境構築**
- [ ] **VPC・セキュリティグループ設定**
- [ ] **RDS PostgreSQL作成** (最小: db.t3.micro)
- [ ] **S3バケット作成** (名前: `[顧客名]-face-recognition-photos`)  
- [ ] **Rekognitionコレクション作成**
- [ ] **Parameter Store設定** (パス: `/face-recognition/[顧客名]/prod/config`)
- [ ] **EC2インスタンス準備** (最小: t3.micro, Node.js 20+, PM2)
- [ ] **IAMロール作成・アタッチ**

### **2. 必要情報収集**
```bash
# 顧客環境情報
顧客名: [CUSTOMER_NAME]
EC2 IP: [EC2_PUBLIC_IP]
SSH鍵パス: [SSH_KEY_PATH]
AWSリージョン: [AWS_REGION]

# AWS設定
RDS接続情報: [DATABASE_URL]
S3バケット名: [S3_BUCKET_NAME]
RekognitionコレクションID: [COLLECTION_ID]
```

---

## 🚀 **デプロイ手順**

### **Step 1: Parameter Store設定**
```bash
# AWS CLIで顧客環境のParameter Store設定
aws ssm put-parameter \
  --name "/face-recognition/[顧客名]/prod/config" \
  --type "SecureString" \
  --value '{
    "databaseUrl": "postgresql://username:password@rds-endpoint:5432/dbname",
    "awsAccessKey": "AKIA...",
    "awsSecretKey": "...",
    "s3Bucket": "[顧客名]-face-recognition-photos",
    "rekognitionCollectionId": "[顧客名]-faces-collection"
  }' \
  --region [AWS_REGION]
```

### **Step 2: デプロイスクリプト設定**
```bash
# deploy_customer_template.sh を顧客用にコピー
cp deploy_customer_template.sh deploy_[顧客名].sh

# 顧客情報を設定
CUSTOMER_NAME="顧客名"
EC2_HOST="ec2-user@[EC2_IP]"
SSH_KEY_PATH="[SSH_KEY_PATH]"
AWS_REGION="[AWS_REGION]"
```

### **Step 3: デプロイ実行**
```bash
# 実行権限付与
chmod +x deploy_[顧客名].sh

# デプロイ実行
./deploy_[顧客名].sh
```

---

## 🔒 **セキュリティ設定**

### **IAMポリシー（EC2ロール用）**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::[顧客名]-face-recognition-photos/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "rekognition:IndexFaces",
        "rekognition:SearchFacesByImage",
        "rekognition:DetectFaces"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter"
      ],
      "Resource": "arn:aws:ssm:[region]:[account]:parameter/face-recognition/[顧客名]/*"
    }
  ]
}
```

### **セキュリティグループ設定**
```bash
# SSH (管理者IPのみ)
Type: SSH, Protocol: TCP, Port: 22, Source: [管理者IP]/32

# HTTP/HTTPS
Type: HTTP, Protocol: TCP, Port: 80, Source: 0.0.0.0/0
Type: HTTPS, Protocol: TCP, Port: 443, Source: 0.0.0.0/0

# アプリケーション (必要に応じて)
Type: Custom TCP, Protocol: TCP, Port: 3000, Source: 0.0.0.0/0
```

---

## 🔧 **環境変数設定**

### **EC2での環境変数設定**
```bash
# /etc/environment に追加
sudo nano /etc/environment

# 追加内容
AWS_REGION="ap-northeast-1"
CONFIG_PATH="/face-recognition/[顧客名]/prod/config"
NODE_ENV="production"
```

### **PM2設定ファイル（オプション）**
```json
// ecosystem.config.js
module.exports = {
  apps: [{
    name: '[顧客名]-face-recognition',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      AWS_REGION: '[AWS_REGION]',
      CONFIG_PATH: '/face-recognition/[顧客名]/prod/config'
    }
  }]
}
```

---

## 📊 **動作確認**

### **1. アプリケーション確認**
```bash
# PM2ステータス
pm2 status

# ログ確認
pm2 logs [顧客名]-face-recognition

# アクセステスト
curl http://[EC2_IP]:3000/health
```

### **2. AWS接続確認**
```bash
# S3接続テスト
aws s3 ls s3://[顧客名]-face-recognition-photos/

# Parameter Store確認
aws ssm get-parameter --name "/face-recognition/[顧客名]/prod/config" --with-decryption
```

---

## 🚨 **トラブルシューティング**

### **よくある問題**

#### **1. Parameter Store接続エラー**
```bash
# IAMロール権限確認
aws sts get-caller-identity

# Parameter Store確認
aws ssm describe-parameters --filters "Key=Name,Values=/face-recognition/[顧客名]"
```

#### **2. npm install エラー**
```bash
# PostgreSQL開発ライブラリインストール
sudo dnf install -y postgresql15-devel make gcc g++

# npm再インストール
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --production --legacy-peer-deps
```

#### **3. 顔認識エラー**
```bash
# Rekognitionコレクション確認
aws rekognition list-collections

# コレクション作成
aws rekognition create-collection --collection-id [顧客名]-faces-collection
```

---

## 💰 **コスト最適化**

### **開発環境（夜間停止）**
```bash
# 自動停止スクリプト (cron: 0 22 * * 1-5)
aws ec2 stop-instances --instance-ids i-1234567890abcdef0
```

### **ログ保持期間設定**
```bash
# PM2ログローテーション
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## 📞 **サポート連絡先**

- **技術サポート**: [support@example.com]
- **緊急連絡**: [emergency@example.com]  
- **ドキュメント**: [https://docs.example.com]

---

## 📝 **更新履歴**

| 日付 | バージョン | 変更内容 |
|------|-----------|----------|
| 2025-06-13 | v1.0 | 初版作成 | 