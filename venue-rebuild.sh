#!/bin/bash

# =============================================================================
# 会場写真データ完全再構築スクリプト
# =============================================================================
# 
# ⚠️  重要注意事項 ⚠️
# =============================================================================
# 1. このスクリプトは指定された会場の全データを完全に削除します
# 2. 削除されるデータ:
#    - Rekognition顔認識データ（復旧不可）
#    - S3写真ファイル（復旧不可）
#    - S3サムネイル（復旧不可）
#    - マニフェストファイル（復旧不可）
# 3. 実行前に必ずバックアップを取得してください
# 4. 新しい写真データが準備されていることを確認してください
# 5. 実行中は中断しないでください（データ不整合の原因となります）
# 
# 使用方法:
#   ./venue-rebuild.sh <venue_id>
#   例: ./venue-rebuild.sh venue_02
# 
# 実行時間: 約5-10分
# 影響範囲: 指定された会場のみ（他会場は影響なし）
# =============================================================================

VENUE_ID=$1

# 引数チェック
if [ -z "$VENUE_ID" ]; then
    echo "❌ エラー: 会場IDが指定されていません"
    echo "使用方法: $0 <venue_id>"
    echo "例: $0 venue_02"
    exit 1
fi

# 確認プロンプト
echo "============================================================================="
echo "⚠️  重要注意事項 ⚠️"
echo "============================================================================="
echo "このスクリプトは会場 $VENUE_ID の全データを完全に削除します"
echo "削除されるデータ:"
echo "  - Rekognition顔認識データ（復旧不可）"
echo "  - S3写真ファイル（復旧不可）"
echo "  - S3サムネイル（復旧不可）"
echo "  - マニフェストファイル（復旧不可）"
echo ""
echo "新しい写真データが準備されていることを確認してください"
echo "============================================================================="
read -p "続行しますか？ (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ 実行をキャンセルしました"
    exit 1
fi

echo ""
echo "=== 会場 $VENUE_ID の完全再構築開始 ==="
echo "開始時刻: $(date)"
echo ""

# 1. 完全クリーンアップ
echo "1️⃣ 完全クリーンアップ開始..."
echo "  - Rekognitionコレクション削除中..."
aws rekognition delete-collection --collection-id "face-recognition-$VENUE_ID" 2>/dev/null || echo "    (コレクションは既に存在しませんでした)"
echo "  - S3サムネイル削除中..."
aws s3 rm "s3://face-recognition-system-bucket/thumbnails/$VENUE_ID/" --recursive 2>/dev/null || echo "    (サムネイルは既に存在しませんでした)"
echo "  - S3写真ファイル削除中..."
aws s3 rm "s3://face-recognition-system-bucket/venues/$VENUE_ID/" --recursive 2>/dev/null || echo "    (写真ファイルは既に存在しませんでした)"
echo "  - マニフェストファイル削除中..."
aws s3 rm "s3://face-recognition-system-bucket/manifests/$VENUE_ID.json" 2>/dev/null || echo "    (マニフェストは既に存在しませんでした)"
echo "✅ 完全クリーンアップ完了"
echo ""

# 2. 新しい写真データアップロード
echo "2️⃣ 新しい写真データアップロード開始..."
echo "  - 一時ディレクトリ作成中..."
mkdir -p "/tmp/${VENUE_ID}_clean"

echo "  - 写真データコピー中..."
# 注意: 実際のパスに変更してください
if [ -d "/Users/keito/Downloads/第2会場" ]; then
    cp -r "/Users/keito/Downloads/第2会場"/* "/tmp/${VENUE_ID}_clean/"
else
    echo "❌ エラー: 新しい写真データが見つかりません"
    echo "パス: /Users/keito/Downloads/第2会場"
    echo "写真データを準備してから再実行してください"
    rm -rf "/tmp/${VENUE_ID}_clean/"
    exit 1
fi

echo "  - システムファイル削除中..."
rm "/tmp/${VENUE_ID}_clean/Thumbs.db" 2>/dev/null || echo "    (Thumbs.dbは存在しませんでした)"

echo "  - S3アップロード中..."
aws s3 sync "/tmp/${VENUE_ID}_clean/" "s3://face-recognition-system-bucket/venues/$VENUE_ID/"

echo "  - 一時ファイル削除中..."
rm -rf "/tmp/${VENUE_ID}_clean/"
echo "✅ 新しい写真データアップロード完了"
echo ""

# 3. マニフェスト生成
echo "3️⃣ マニフェスト生成開始..."
node scripts/generate-manifests.js $VENUE_ID
echo "✅ マニフェスト生成完了"
echo ""

# 4. 顔認識データ登録
echo "4️⃣ 顔認識データ登録開始..."
node scripts/pre-index-venue-photos.js $VENUE_ID
echo "✅ 顔認識データ登録完了"
echo ""

# 5. 最終確認
echo "5️⃣ 最終確認..."
echo "  - S3写真ファイル数:"
aws s3 ls "s3://face-recognition-system-bucket/venues/$VENUE_ID/" | wc -l
echo "  - Rekognition顔認識データ数:"
aws rekognition list-faces --collection-id "face-recognition-$VENUE_ID" --max-items 1 | grep -c "ExternalImageId" || echo "0"
echo "  - マニフェストファイル:"
aws s3 ls "s3://face-recognition-system-bucket/manifests/$VENUE_ID.json" | wc -l
echo "✅ 最終確認完了"
echo ""

echo "=== 会場 $VENUE_ID の完全再構築完了 ==="
echo "完了時刻: $(date)"
echo ""
echo "🎉 再構築が正常に完了しました！"
echo ""
echo "次のステップ:"
echo "1. 会場 $VENUE_ID の写真一覧表示を確認"
echo "2. サムネイル表示を確認"
echo "3. 顔検索機能を確認"
echo ""
echo "⚠️  注意: 問題が発生した場合は、ログを確認してください" 