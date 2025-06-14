#!/bin/bash

# Parameter Store統合設定スクリプト
# 使用方法: ./scripts/setup-parameter-store.sh

echo "🔧 Parameter Store統合設定を開始します..."

# JSON設定ファイルの内容
CONFIG_JSON='{
  "database": {
    "url": "postgresql://postgres:r00t12345@face-recognition-db.clo82qsmkr3w.ap-northeast-1.rds.amazonaws.com:5432/face_recognition_db"
  },
  "auth": {
    "adminUsername": "admin",
    "adminPassword": "admin123",
    "userCommonPassword": "user123"
  },
  "aws": {
    "accessKeyId": "AKIA2JQHV4LBT6TXYSQR",
    "secretAccessKey": "YOUR_SECRET_KEY_HERE",
    "s3Bucket": "face-recognition-system-images-gakkai",
    "rekognitionCollectionId": "face-recognition-system"
  }
}'

# Parameter Storeに統合設定を保存
echo "📝 Parameter Store に統合設定を保存中..."
aws ssm put-parameter \
    --name "/face-recognition/prod/config" \
    --value "$CONFIG_JSON" \
    --type "SecureString" \
    --overwrite \
    --region ap-northeast-1

if [ $? -eq 0 ]; then
    echo "✅ Parameter Store統合設定が完了しました"
    echo "📍 パラメータパス: /face-recognition/prod/config"
    
    # 既存の個別パラメータを削除（オプション）
    echo ""
    echo "🧹 既存の個別パラメータを削除しますか？ (y/n)"
    read -p "削除する場合は 'y' を入力: " DELETE_OLD
    
    if [ "$DELETE_OLD" = "y" ]; then
        echo "🗑️ 既存パラメータを削除中..."
        
        OLD_PARAMS=(
            "/face-recognition-system/test/databaseUrl"
            "/face-recognition-system/test/adminUsername"
            "/face-recognition-system/test/adminPassword"
            "/face-recognition-system/test/userCommonPassword"
            "/face-recognition-system/test/awsAccessKey"
            "/face-recognition-system/test/awsSecretKey"
            "/face-recognition-system/test/s3Bucket"
            "/face-recognition-system/test/rekognitionCollectionId"
        )
        
        for param in "${OLD_PARAMS[@]}"; do
            aws ssm delete-parameter --name "$param" --region ap-northeast-1 2>/dev/null
            if [ $? -eq 0 ]; then
                echo "  ✅ 削除完了: $param"
            else
                echo "  ⚠️  削除スキップ: $param (存在しない可能性があります)"
            fi
        done
    fi
    
    echo ""
    echo "🎉 設定完了！アプリケーションは統合設定を使用します"
    
else
    echo "❌ Parameter Store設定に失敗しました"
    exit 1
fi

# 設定確認
echo ""
echo "🔍 設定内容を確認中..."
aws ssm get-parameter --name "/face-recognition/prod/config" --with-decryption --region ap-northeast-1 --query 'Parameter.Value' --output text | jq '.'

echo ""
echo "✨ Parameter Store統合設定が完了しました！" 