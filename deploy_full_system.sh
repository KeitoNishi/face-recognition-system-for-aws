#!/bin/bash

# 顔認識システム完全デプロイスクリプト
# Parameter Store設定 → ローカルビルド → EC2デプロイ → ログ設定

set -e

echo "🚀 顔認識システム完全デプロイを開始します..."

# 1. Parameter Store設定
echo ""
echo "=== 🔧 Parameter Store設定 ==="
echo "Parameter Storeに統合設定を保存します..."

# Parameter Store設定スクリプトが存在するかチェック
if [ ! -f "scripts/setup-parameter-store.sh" ]; then
    echo "❌ scripts/setup-parameter-store.sh が見つかりません"
    exit 1
fi

# Parameter Store設定を実行
chmod +x scripts/setup-parameter-store.sh
./scripts/setup-parameter-store.sh

echo "✅ Parameter Store設定完了"

# 2. ローカルビルドとEC2デプロイ
echo ""
echo "=== 🏗️ アプリケーションビルドとデプロイ ==="

# デプロイスクリプトが存在するかチェック
if [ ! -f "deploy_with_pm2.sh" ]; then
    echo "❌ deploy_with_pm2.sh が見つかりません"
    exit 1
fi

# デプロイを実行
chmod +x deploy_with_pm2.sh
./deploy_with_pm2.sh

echo "✅ アプリケーションデプロイ完了"

# 3. EC2でのログ設定
echo ""
echo "=== 📁 EC2ログシステム設定 ==="

EC2_KEY_PATH="/Users/keito/workspace/key-aws/ec2-key-pair.pem"
EC2_HOST="ec2-user@35.78.69.124"
DEPLOY_PATH="/home/ec2-user/app/face-recognition"

echo "EC2でログシステムを設定中..."

# ログ設定スクリプトをEC2に転送して実行
scp -i $EC2_KEY_PATH scripts/setup-ec2-logs.sh $EC2_HOST:/tmp/
ssh -i $EC2_KEY_PATH $EC2_HOST \
    "chmod +x /tmp/setup-ec2-logs.sh && sudo /tmp/setup-ec2-logs.sh && rm /tmp/setup-ec2-logs.sh"

echo "✅ EC2ログシステム設定完了"

# 4. システム動作確認
echo ""
echo "=== 🔍 システム動作確認 ==="

echo "アプリケーション状態を確認中..."
ssh -i $EC2_KEY_PATH $EC2_HOST \
    "cd $DEPLOY_PATH && echo '🔄 PM2プロセス状態:' && pm2 list && echo '' && echo '📁 ログディレクトリ:' && ls -la logs/ && echo '' && echo '📊 最新ログ（10行）:' && tail -10 logs/*.log 2>/dev/null || echo 'まだログファイルがありません'"

# 5. 接続テスト
echo ""
echo "=== 🌐 接続テスト ==="

EC2_IP="35.78.69.124"
APP_URL="http://$EC2_IP:3000"

echo "アプリケーションの疎通確認中..."
if curl -s --connect-timeout 10 "$APP_URL" > /dev/null; then
    echo "✅ アプリケーションは正常に動作しています"
else
    echo "⚠️  アプリケーションへの接続に失敗しました（起動中の可能性があります）"
fi

# 6. 完了メッセージ
echo ""
echo "🎉 顔認識システム完全デプロイが完了しました！"
echo ""
echo "=== 📋 システム情報 ==="
echo "🌐 アプリケーションURL: $APP_URL"
echo "🗄️  Parameter Store: /face-recognition/prod/config"
echo "📂 EC2デプロイ先: $DEPLOY_PATH"
echo "📁 ログディレクトリ: $DEPLOY_PATH/logs"
echo ""
echo "=== 🔧 管理コマンド ==="
echo "📊 PM2状態確認:"
echo "  ssh -i $EC2_KEY_PATH $EC2_HOST 'pm2 list'"
echo ""
echo "📋 ログ確認:"
echo "  ssh -i $EC2_KEY_PATH $EC2_HOST 'pm2 logs face-recognition-app'"
echo "  ssh -i $EC2_KEY_PATH $EC2_HOST 'tail -f $DEPLOY_PATH/logs/*.log'"
echo ""
echo "🔄 アプリケーション再起動:"
echo "  ssh -i $EC2_KEY_PATH $EC2_HOST 'pm2 restart face-recognition-app'"
echo ""
echo "📈 ログ分析（ローカル）:"
echo "  ./scripts/log-analyzer.sh"
echo ""
echo "✨ システムの準備が完了しました！" 