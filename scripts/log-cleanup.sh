#!/bin/bash

# ログクリーンアップスクリプト
# 使用方法: ./scripts/log-cleanup.sh [days]
# 例: ./scripts/log-cleanup.sh 30  # 30日以上古いログを削除

DAYS=${1:-30}  # デフォルト30日
LOG_DIR="./logs"

echo "🧹 ログクリーンアップを開始します..."
echo "📂 ログディレクトリ: $LOG_DIR"
echo "📅 保存期間: ${DAYS}日"

# ログディレクトリが存在しない場合は終了
if [ ! -d "$LOG_DIR" ]; then
    echo "❌ ログディレクトリが見つかりません: $LOG_DIR"
    exit 1
fi

# 古いログファイルを検索
OLD_FILES=$(find "$LOG_DIR" -name "*.log" -type f -mtime +$DAYS)

if [ -z "$OLD_FILES" ]; then
    echo "✅ 削除対象のログファイルはありません"
    exit 0
fi

echo "🗑️  削除対象のログファイル:"
echo "$OLD_FILES"

# 確認
echo ""
echo "上記のファイルを削除しますか？ (y/N)"
read -r CONFIRM

if [ "$CONFIRM" = "y" ] || [ "$CONFIRM" = "Y" ]; then
    # ファイルサイズの計算
    TOTAL_SIZE=$(echo "$OLD_FILES" | xargs du -ch | tail -1 | cut -f1)
    
    # 削除実行
    echo "$OLD_FILES" | xargs rm -f
    
    echo "✅ ログファイルを削除しました"
    echo "💾 削除されたサイズ: $TOTAL_SIZE"
    
    # 残存ファイル数を表示
    REMAINING=$(find "$LOG_DIR" -name "*.log" -type f | wc -l)
    echo "📁 残存ログファイル数: $REMAINING"
else
    echo "❌ 削除をキャンセルしました"
fi

echo "🏁 ログクリーンアップが完了しました" 