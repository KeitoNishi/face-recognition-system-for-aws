#!/bin/bash

# テストデータセットアップスクリプト
# 使用法: ./setup-test-data.sh [EC2のIPアドレス]

set -e

EC2_IP="${1:-35.78.69.124}"
KEY_PATH="/Users/keito/workspace/key-aws/ec2-key-pair.pem"
DB_HOST="face-recognition-db.c0g12z1wxn1k.ap-northeast-1.rds.amazonaws.com"
DB_USER="face_recognition_user"
DB_NAME="face_recognition_db"

echo "🚀 テストデータセットアップ開始"
echo "EC2 IP: $EC2_IP"

# PostgreSQLクライアントインストール確認・実行
echo "📦 PostgreSQLクライアントのインストール..."
ssh -i "$KEY_PATH" ec2-user@"$EC2_IP" << 'EOF'
if ! command -v psql &> /dev/null; then
    echo "PostgreSQLクライアントをインストール中..."
    sudo dnf install -y postgresql15
    echo "✅ PostgreSQLクライアントインストール完了"
else
    echo "✅ PostgreSQLクライアントは既にインストール済み"
fi
psql --version
EOF

# テストデータの投入
echo "📊 テストデータの投入..."
ssh -i "$KEY_PATH" ec2-user@"$EC2_IP" << EOF
cd /home/ec2-user
if [ ! -f test-data.sql ]; then
    echo "❌ test-data.sqlが見つかりません"
    exit 1
fi

echo "データベースに接続してテストデータを投入..."
export PGPASSWORD="YOUR_DB_PASSWORD_HERE"
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f test-data.sql

echo "✅ テストデータ投入完了"
EOF

echo ""
echo "🎉 セットアップ完了！"
echo ""
echo "🔐 テスト用ログイン情報:"
echo "----------------------------------------"
echo "【一般ユーザー】"
echo "  URL: http://$EC2_IP:3000/"
echo "  パスワード: test2024"
echo ""
echo "【管理者】"
echo "  URL: http://$EC2_IP:3000/admin"
echo "  ユーザー名: admin"
echo "  パスワード: admin2024"
echo "----------------------------------------"
echo ""
echo "📋 データ確認:"
echo "  - 会場数: 7件"
echo "  - 写真数: 58件"
echo "  - 顔認識ユーザー: 10件"
echo ""
echo "⚠️ 注意: Parameter Storeの設定も忘れずに！" 