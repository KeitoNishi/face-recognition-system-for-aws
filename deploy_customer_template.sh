#!/bin/bash

# 顧客環境デプロイ設定テンプレート
# 使用前に以下の変数を顧客環境に合わせて設定してください

# =================================
# 顧客環境設定（要変更）
# =================================
CUSTOMER_NAME="[CUSTOMER_NAME]"           # 顧客名を入力
EC2_HOST="[EC2_USER]@[EC2_IP]"           # ec2-user@1.2.3.4 形式
SSH_KEY_PATH="[SSH_KEY_PATH]"            # SSH秘密鍵パス
DEPLOY_PATH="/home/ec2-user/app/${CUSTOMER_NAME}-face-recognition"
AWS_REGION="[AWS_REGION]"                # ap-northeast-1 等
CONFIG_PATH="/face-recognition/${CUSTOMER_NAME}/prod/config"

# =================================
# 自動設定（通常変更不要）
# =================================
LOCAL_DIR=$(pwd)
BUILD_DIR=".next"
ARCHIVE_NAME="deploy-${CUSTOMER_NAME}.tar.gz"

# 色付きメッセージ関数
red() { echo -e "\033[31m$1\033[0m"; }
green() { echo -e "\033[32m$1\033[0m"; }
yellow() { echo -e "\033[33m$1\033[0m"; }
blue() { echo -e "\033[34m$1\033[0m"; }

# 設定確認
echo "========================================="
blue "顧客環境デプロイ設定確認"
echo "========================================="
echo "顧客名: ${CUSTOMER_NAME}"
echo "EC2ホスト: ${EC2_HOST}" 
echo "デプロイパス: ${DEPLOY_PATH}"
echo "AWSリージョン: ${AWS_REGION}"
echo "設定パス: ${CONFIG_PATH}"
echo "========================================="

# 継続確認
read -p "この設定でデプロイを開始しますか？ (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    red "デプロイを中止しました"
    exit 1
fi

# ビルド実行
blue "ローカルビルド開始..."
npm run build
if [ $? -ne 0 ]; then
    red "ビルドに失敗しました"
    exit 1
fi
green "✅ ビルド完了"

# アーカイブ作成
blue "デプロイパッケージ作成中..."
tar -czf ${ARCHIVE_NAME} \
    .next \
    public \
    package.json \
    next.config.mjs \
    app \
    components \
    lib \
    hooks \
    styles \
    types \
    middleware.ts \
    components.json \
    postcss.config.mjs \
    tailwind.config.ts \
    scripts

green "✅ パッケージ作成完了: ${ARCHIVE_NAME}"

# EC2転送
blue "EC2への転送開始..."
scp -i ${SSH_KEY_PATH} ${ARCHIVE_NAME} ${EC2_HOST}:~/
if [ $? -ne 0 ]; then
    red "転送に失敗しました"
    exit 1
fi
green "✅ 転送完了"

# EC2でデプロイ実行
blue "EC2でのデプロイ開始..."
ssh -i ${SSH_KEY_PATH} ${EC2_HOST} << EOF
    # 環境変数設定
    export AWS_REGION="${AWS_REGION}"
    export CONFIG_PATH="${CONFIG_PATH}"
    export NODE_ENV="production"
    
    # ディレクトリ準備
    mkdir -p ${DEPLOY_PATH}
    cd ${DEPLOY_PATH}
    
    # 旧バックアップ作成
    if [ -d ".next" ]; then
        mv .next .next.backup.\$(date +%Y%m%d_%H%M%S)
    fi
    
    # 新しいファイル展開
    tar -xzf ~/${ARCHIVE_NAME}
    rm ~/${ARCHIVE_NAME}
    
    # 依存関係インストール
    npm cache clean --force
    npm install --production --legacy-peer-deps
    
    # PM2での起動/再起動
    if pm2 list | grep -q "${CUSTOMER_NAME}-face-recognition"; then
        pm2 restart ${CUSTOMER_NAME}-face-recognition
    else
        pm2 start npm --name "${CUSTOMER_NAME}-face-recognition" -- start
    fi
    
    pm2 save
EOF

if [ $? -ne 0 ]; then
    red "EC2でのデプロイに失敗しました"
    exit 1
fi

# 完了メッセージ
green "========================================="
green "🎉 デプロイ完了！"
green "========================================="
echo "顧客: ${CUSTOMER_NAME}"
echo "アクセスURL: http://$(echo ${EC2_HOST} | cut -d'@' -f2):3000"
echo "PM2プロセス名: ${CUSTOMER_NAME}-face-recognition"
echo "========================================="

# 後処理
rm ${ARCHIVE_NAME}
green "✅ 一時ファイル削除完了" 