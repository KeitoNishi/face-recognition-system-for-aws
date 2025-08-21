#!/bin/bash

# EC2古いアプリ確認・クリーンアップスクリプト
# EC2にSSH接続して実行

set -e

PROJECT_NAME="face-recognition-system"
PROJECT_PATH="/home/ec2-user/${PROJECT_NAME}"

echo "🔍 EC2古いアプリ確認開始"

# 現在のディレクトリ内容確認
echo "📁 /home/ec2-user の内容確認..."
ls -la /home/ec2-user/

# PM2プロセス確認
echo "📊 PM2プロセス確認..."
pm2 list || echo "PM2がインストールされていません"

# 古いプロジェクトディレクトリ確認
echo "📂 古いプロジェクトディレクトリ確認..."
find /home/ec2-user -name "*face*" -type d 2>/dev/null || echo "face関連ディレクトリが見つかりません"
find /home/ec2-user -name "*recognition*" -type d 2>/dev/null || echo "recognition関連ディレクトリが見つかりません"
find /home/ec2-user -name "*gallery*" -type d 2>/dev/null || echo "gallery関連ディレクトリが見つかりません"

# ポート使用状況確認
echo "🔌 ポート使用状況確認..."
netstat -tlnp | grep :3000 || echo "ポート3000は使用されていません"
netstat -tlnp | grep :80 || echo "ポート80は使用されていません"

echo "✅ 確認完了"
echo ""
echo "💡 クリーンアップが必要な場合は以下を実行してください："
echo "1. 古いディレクトリ削除: rm -rf /home/ec2-user/old-project-name"
echo "2. PM2プロセス削除: pm2 delete old-process-name"
echo "3. 古いファイル削除: rm -rf /home/ec2-user/unused-files" 