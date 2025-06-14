#!/bin/bash

# ログ分析スクリプト
# 使用方法: ./scripts/log-analyzer.sh [date]
# 例: ./scripts/log-analyzer.sh 2024-01-15

DATE=${1:-$(date +%Y-%m-%d)}
LOG_FILE="./logs/${DATE}.log"

echo "📊 ログ分析を開始します"
echo "📅 対象日付: $DATE"
echo "📂 ログファイル: $LOG_FILE"

if [ ! -f "$LOG_FILE" ]; then
    echo "❌ ログファイルが見つかりません: $LOG_FILE"
    exit 1
fi

echo ""
echo "=== 📈 基本統計 ==="

# 総リクエスト数
TOTAL_REQUESTS=$(grep -c "API Request Started" "$LOG_FILE")
echo "🔢 総リクエスト数: $TOTAL_REQUESTS"

# エラー数
ERROR_COUNT=$(grep -c '"level":"ERROR"' "$LOG_FILE")
echo "❌ エラー数: $ERROR_COUNT"

# 警告数
WARN_COUNT=$(grep -c '"level":"WARN"' "$LOG_FILE")
echo "⚠️  警告数: $WARN_COUNT"

# 認証成功・失敗
AUTH_SUCCESS=$(grep -c "Authentication Success" "$LOG_FILE")
AUTH_FAILED=$(grep -c "Authentication Failed" "$LOG_FILE")
echo "🔐 認証成功: $AUTH_SUCCESS"
echo "🚫 認証失敗: $AUTH_FAILED"

echo ""
echo "=== 🌐 APIエンドポイント別統計 ==="

# APIエンドポイント別リクエスト数
echo "📋 リクエスト数TOP5:"
grep "API Request Started" "$LOG_FILE" | \
  grep -o '"api":"[^"]*"' | \
  sort | uniq -c | sort -nr | head -5 | \
  while read count api; do
    api_clean=$(echo $api | sed 's/"api":"//; s/"//')
    echo "  $api_clean: $count"
  done

echo ""
echo "=== 🐛 エラー分析 ==="

if [ $ERROR_COUNT -gt 0 ]; then
    echo "🔴 エラーメッセージTOP5:"
    grep '"level":"ERROR"' "$LOG_FILE" | \
      grep -o '"message":"[^"]*"' | \
      sort | uniq -c | sort -nr | head -5 | \
      while read count message; do
        msg_clean=$(echo $message | sed 's/"message":"//; s/"//')
        echo "  ($count) $msg_clean"
      done
else
    echo "✅ エラーはありません"
fi

echo ""
echo "=== ⏱️  パフォーマンス分析 ==="

# 平均レスポンス時間
AVG_DURATION=$(grep "API Request Completed" "$LOG_FILE" | \
  grep -o '"duration":[0-9]*' | \
  sed 's/"duration"://' | \
  awk '{sum+=$1; count++} END {if(count>0) printf "%.2f", sum/count; else print "0"}')
echo "⏱️  平均レスポンス時間: ${AVG_DURATION}ms"

# 最も遅いリクエスト
SLOWEST=$(grep "API Request Completed" "$LOG_FILE" | \
  grep -o '"duration":[0-9]*' | \
  sed 's/"duration"://' | \
  sort -nr | head -1)
echo "🐌 最も遅いリクエスト: ${SLOWEST}ms"

# S3操作の統計
S3_COUNT=$(grep "S3.*operation" "$LOG_FILE" | wc -l)
if [ $S3_COUNT -gt 0 ]; then
    echo "☁️  S3操作回数: $S3_COUNT"
    
    AVG_S3_DURATION=$(grep "S3.*operation" "$LOG_FILE" | \
      grep -o '"duration":[0-9]*' | \
      sed 's/"duration"://' | \
      awk '{sum+=$1; count++} END {if(count>0) printf "%.2f", sum/count; else print "0"}')
    echo "☁️  S3平均処理時間: ${AVG_S3_DURATION}ms"
fi

echo ""
echo "=== 👥 ユーザー活動 ==="

# ユニークIP数
UNIQUE_IPS=$(grep -o '"ip":"[^"]*"' "$LOG_FILE" | sort | uniq | wc -l)
echo "🌍 ユニークIP数: $UNIQUE_IPS"

# 最もアクティブなIP TOP3
echo "📊 最もアクティブなIP TOP3:"
grep -o '"ip":"[^"]*"' "$LOG_FILE" | \
  sort | uniq -c | sort -nr | head -3 | \
  while read count ip; do
    ip_clean=$(echo $ip | sed 's/"ip":"//; s/"//')
    echo "  $ip_clean: $count リクエスト"
  done

echo ""
echo "=== 📱 ユーザーエージェント分析 ==="

# ブラウザ/クライアント分析
echo "🌐 主なユーザーエージェント:"
grep -o '"userAgent":"[^"]*"' "$LOG_FILE" | \
  sed 's/"userAgent":"//; s/"//' | \
  grep -E "(Chrome|Firefox|Safari|Edge|Mobile)" | \
  sed 's/.*\(Chrome\|Firefox\|Safari\|Edge\|Mobile\).*/\1/' | \
  sort | uniq -c | sort -nr | head -5 | \
  while read count agent; do
    echo "  $agent: $count"
  done

echo ""
echo "=== 📈 時間別分析 ==="

# 時間別リクエスト分布
echo "⏰ 時間別リクエスト分布:"
grep "API Request Started" "$LOG_FILE" | \
  grep -o '"timestamp":"[^"]*"' | \
  sed 's/"timestamp":"//; s/"//' | \
  cut -d'T' -f2 | cut -d':' -f1 | \
  sort | uniq -c | sort -k2 -n | \
  while read count hour; do
    printf "  %02d:00-%02d:59: %d リクエスト\n" $hour $hour $count
  done

echo ""
echo "🏁 ログ分析が完了しました" 