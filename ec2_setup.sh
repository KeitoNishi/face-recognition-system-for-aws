#!/bin/bash

# EC2上でのセットアップスクリプト
# EC2にSSH接続して実行

set -e

PROJECT_NAME="face-recognition-system"
PROJECT_PATH="/home/ec2-user/${PROJECT_NAME}"

echo "🔧 EC2セットアップ開始"

# 古いアプリの確認
echo "🔍 古いアプリケーション確認中..."
echo "📁 /home/ec2-user の内容:"
ls -la /home/ec2-user/

echo "📊 PM2プロセス確認:"
pm2 list || echo "PM2がインストールされていません"

echo "🔌 ポート使用状況確認:"
netstat -tlnp | grep :3000 || echo "ポート3000は使用されていません"

# 古いプロジェクトディレクトリの確認
echo "📂 古いプロジェクトディレクトリ確認:"
find /home/ec2-user -name "*face*" -type d 2>/dev/null || echo "face関連ディレクトリが見つかりません"
find /home/ec2-user -name "*recognition*" -type d 2>/dev/null || echo "recognition関連ディレクトリが見つかりません"
find /home/ec2-user -name "*gallery*" -type d 2>/dev/null || echo "gallery関連ディレクトリが見つかりません"

# ユーザーに確認
echo ""
echo "⚠️  古いアプリケーションが見つかりました。"
echo "以下のオプションから選択してください："
echo "1) 古いアプリを停止して新しいアプリを起動（推奨）"
echo "2) 古いアプリを削除してから新しいアプリを起動"
echo "3) 古いアプリをそのままにして新しいアプリを起動"
echo ""
read -p "選択してください (1/2/3): " choice

case $choice in
    1)
        echo "🛑 古いアプリを停止中..."
        pm2 stop all || true
        pm2 delete all || true
        ;;
    2)
        echo "🗑️  古いアプリを削除中..."
        pm2 stop all || true
        pm2 delete all || true
        # 古いディレクトリをバックアップしてから削除
        if [ -d "/home/ec2-user/face-recognition" ]; then
            mv /home/ec2-user/face-recognition /home/ec2-user/face-recognition-backup-$(date +%Y%m%d)
        fi
        if [ -d "/home/ec2-user/gallery" ]; then
            mv /home/ec2-user/gallery /home/ec2-user/gallery-backup-$(date +%Y%m%d)
        fi
        ;;
    3)
        echo "📝 古いアプリをそのままにして新しいアプリを起動"
        ;;
    *)
        echo "❌ 無効な選択です。デフォルトで古いアプリを停止します。"
        pm2 stop all || true
        pm2 delete all || true
        ;;
esac

cd ${PROJECT_PATH}

# Node.js 18+ 確認
echo "📋 Node.js バージョン確認..."
node --version
npm --version

# 依存関係インストール
echo "📦 依存関係インストール中..."
npm install --production

# PM2インストール（初回のみ）
echo "⚡ PM2インストール中..."
npm install -g pm2

# 既存プロセス停止
echo "🛑 既存プロセス停止中..."
pm2 stop ${PROJECT_NAME} || true
pm2 delete ${PROJECT_NAME} || true

# アプリケーション起動
echo "🚀 アプリケーション起動中..."
pm2 start npm --name "${PROJECT_NAME}" -- start:prod

# 自動起動設定
echo "⚙️ 自動起動設定中..."
pm2 startup
pm2 save

# 状態確認
echo "📊 プロセス状態確認..."
pm2 status
pm2 logs ${PROJECT_NAME} --lines 10

echo "✅ EC2セットアップ完了！"
echo "🌐 アプリケーションURL: http://52.195.165.233:3000" 