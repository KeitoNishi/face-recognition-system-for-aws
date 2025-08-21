#!/bin/bash

# 顔認識システム EC2デプロイスクリプト
# 改善版: macOS拡張属性ファイル除外、環境確認、エラーハンドリング

set -e  # エラー時に停止

# 設定
EC2_IP="52.195.165.233"
EC2_USER="ec2-user"
KEY_PATH="/Users/keito/workspace/key-aws/ec2-key-pair.pem"
PROJECT_NAME="face-recognition-system"

echo "🚀 顔認識システム EC2デプロイ開始"

# 1. 環境確認
echo "📋 環境確認中..."
echo "Node.js: $(node --version)"
echo "npm: $(npm --version)"

# 2. ローカルビルド
echo "🔨 ローカルビルド中..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ ローカルビルド失敗"
    exit 1
fi
echo "✅ ローカルビルド完了"

# 3. 圧縮ファイル作成（macOS拡張属性ファイル除外、.nextディレクトリ含む）
echo "📦 圧縮ファイル作成中..."
rm -f ${PROJECT_NAME}-production.tar.gz
tar -czf ${PROJECT_NAME}-production.tar.gz \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=._* \
    --exclude=${PROJECT_NAME}-production.tar.gz \
    --exclude=*.tar.gz \
    .
echo "✅ 圧縮ファイル作成完了: $(ls -lh ${PROJECT_NAME}-production.tar.gz)"

# 4. EC2接続確認
echo "🔌 EC2接続確認中..."
ssh -i ${KEY_PATH} -o ConnectTimeout=10 ${EC2_USER}@${EC2_IP} "echo 'EC2接続OK'" || {
    echo "❌ EC2接続失敗"
    exit 1
}

# 5. EC2環境確認
echo "🔍 EC2環境確認中..."
ssh -i ${KEY_PATH} ${EC2_USER}@${EC2_IP} "
    echo 'Node.js: ' \$(node --version)
    echo 'npm: ' \$(npm --version)
    echo 'PM2: ' \$(pm2 --version 2>/dev/null || echo '未インストール')
"

# 6. 既存プロジェクト停止・削除
echo "🧹 既存プロジェクトクリーンアップ中..."
ssh -i ${KEY_PATH} ${EC2_USER}@${EC2_IP} "
    pm2 stop ${PROJECT_NAME} 2>/dev/null || true
    pm2 delete ${PROJECT_NAME} 2>/dev/null || true
    rm -rf /home/${EC2_USER}/${PROJECT_NAME}*
    rm -rf /home/${EC2_USER}/node_modules
    rm -rf /home/${EC2_USER}/.next
    rm -f /home/${EC2_USER}/*.tar.gz
    echo 'クリーンアップ完了'
"

# 7. ファイル転送
echo "📤 ファイル転送中..."
scp -i ${KEY_PATH} ${PROJECT_NAME}-production.tar.gz ${EC2_USER}@${EC2_IP}:/home/${EC2_USER}/
echo "✅ ファイル転送完了"

# 8. EC2上での展開・セットアップ
echo "🔧 EC2上でのセットアップ中..."
ssh -i ${KEY_PATH} ${EC2_USER}@${EC2_IP} "
    cd /home/${EC2_USER}
    
    # 展開
    tar -xzf ${PROJECT_NAME}-production.tar.gz
    
    # macOS拡張属性ファイル削除
    find . -name '._*' -delete
    
    # 依存関係インストール
    npm install --production
    
    # PM2インストール（未インストールの場合）
    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2
    fi
    
    # アプリケーション起動
    pm2 start npm --name '${PROJECT_NAME}' -- start
    
    # 自動起動設定
    pm2 save
    pm2 startup systemd -u ${EC2_USER} --hp /home/${EC2_USER} 2>/dev/null || true
    
    echo 'セットアップ完了'
"

# 9. 動作確認
echo "✅ 動作確認中..."
sleep 5
ssh -i ${KEY_PATH} ${EC2_USER}@${EC2_IP} "
    pm2 status
    echo 'アプリケーションログ:'
    pm2 logs ${PROJECT_NAME} --lines 5
"

echo "🎉 デプロイ完了！"
echo "🌐 アクセスURL: http://${EC2_IP}:3000"
echo "📊 PM2管理: ssh -i ${KEY_PATH} ${EC2_USER}@${EC2_IP} 'pm2 status'" 