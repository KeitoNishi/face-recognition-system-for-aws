#!/bin/bash

# EC2ログディレクトリ設定スクリプト
# EC2上でアプリケーション用ログディレクトリを作成・設定

APP_DIR="/home/ec2-user/app/face-recognition"
LOG_DIR="$APP_DIR/logs"
PM2_LOG_DIR="/home/ec2-user/.pm2/logs"

echo "🔧 EC2ログディレクトリセットアップを開始します..."

# アプリケーションログディレクトリ作成
echo "📁 アプリケーションログディレクトリを作成中..."
mkdir -p "$LOG_DIR"
chmod 755 "$LOG_DIR"
chown ec2-user:ec2-user "$LOG_DIR"

# PM2ログディレクトリ確認
echo "📁 PM2ログディレクトリを確認中..."
mkdir -p "$PM2_LOG_DIR"
chmod 755 "$PM2_LOG_DIR"
chown ec2-user:ec2-user "$PM2_LOG_DIR"

# ログローテーション設定
echo "🔄 ログローテーション設定を作成中..."
sudo tee /etc/logrotate.d/face-recognition > /dev/null <<EOF
$LOG_DIR/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
    create 644 ec2-user ec2-user
}

$PM2_LOG_DIR/face-recognition-*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
    create 644 ec2-user ec2-user
}
EOF

# crontabでログクリーンアップを設定
echo "⏰ 自動ログクリーンアップを設定中..."
(crontab -l 2>/dev/null; echo "0 2 * * * cd $APP_DIR && ./scripts/log-cleanup.sh 30 > /dev/null 2>&1") | crontab -

# ディスク使用量監視スクリプト作成
echo "💾 ディスク使用量監視スクリプトを作成中..."
tee "$APP_DIR/scripts/disk-monitor.sh" > /dev/null <<'EOF'
#!/bin/bash

# ディスク使用量監視
THRESHOLD=80
USAGE=$(df /home | awk 'NR==2 {print $5}' | sed 's/%//')

if [ "$USAGE" -gt "$THRESHOLD" ]; then
    echo "⚠️ WARNING: ディスク使用量が${USAGE}%に達しています"
    echo "古いログファイルをクリーンアップしています..."
    
    # 7日以上古いアプリケーションログを削除
    find /home/ec2-user/app/face-recognition/logs -name "*.log" -mtime +7 -delete
    
    # 14日以上古いPM2ログを削除
    find /home/ec2-user/.pm2/logs -name "*.log" -mtime +14 -delete
    
    echo "ログクリーンアップが完了しました"
fi
EOF

chmod +x "$APP_DIR/scripts/disk-monitor.sh"

# ディスク監視をcrontabに追加
(crontab -l 2>/dev/null; echo "0 */6 * * * $APP_DIR/scripts/disk-monitor.sh >> $LOG_DIR/disk-monitor.log 2>&1") | crontab -

# 設定確認
echo ""
echo "✅ EC2ログ設定が完了しました"
echo "📂 ログディレクトリ: $LOG_DIR"
echo "🔐 権限設定: ubuntu:ubuntu 755"
echo "🔄 ログローテーション: 30日保持"
echo "⏰ 自動クリーンアップ: 毎日2時実行"
echo "💾 ディスク監視: 6時間毎実行"

# 現在の設定表示
echo ""
echo "=== 📊 現在の状況 ==="
echo "ディスク使用量:"
df -h /home/ec2-user
echo ""
echo "ログディレクトリサイズ:"
du -sh "$LOG_DIR" 2>/dev/null || echo "まだログファイルはありません"
echo ""
echo "設定されたcrontab:"
crontab -l | grep -E "(log-cleanup|disk-monitor)" || echo "crontabエントリはありません"

echo ""
echo "🎉 EC2ログセットアップが完了しました！" 