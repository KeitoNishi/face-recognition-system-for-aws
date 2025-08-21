#!/bin/bash

# 環境チェックスクリプト
# デプロイ前の環境確認を自動化

set -e

echo "🔍 環境チェック開始"

# 1. Node.js環境確認
echo "📋 Node.js環境確認..."
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
echo "✅ Node.js: $NODE_VERSION"
echo "✅ npm: $NPM_VERSION"

# Node.js バージョンチェック
if [[ ! "$NODE_VERSION" =~ ^v2[0-9]\. ]]; then
    echo "⚠️  警告: Node.js 20以上を推奨 (現在: $NODE_VERSION)"
fi

# 2. プロジェクトファイル確認
echo "📁 プロジェクトファイル確認..."
REQUIRED_FILES=("package.json" "next.config.mjs" "tsconfig.json" "app/layout.tsx")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file が見つかりません"
        exit 1
    fi
done

# 3. 依存関係確認
echo "📦 依存関係確認..."
if [ -f "package-lock.json" ]; then
    echo "✅ package-lock.json 存在"
else
    echo "⚠️  package-lock.json が存在しません。npm install を実行してください"
fi

# 4. ビルドテスト
echo "🔨 ビルドテスト..."
if npm run build > /dev/null 2>&1; then
    echo "✅ ビルド成功"
else
    echo "❌ ビルド失敗"
    echo "ビルドエラーを確認してください:"
    npm run build
    exit 1
fi

# 5. .nextディレクトリ確認
echo "📂 ビルド成果物確認..."
if [ -d ".next" ]; then
    echo "✅ .next ディレクトリ存在"
    NEXT_SIZE=$(du -sh .next | cut -f1)
    echo "📊 .next サイズ: $NEXT_SIZE"
else
    echo "❌ .next ディレクトリが見つかりません"
    exit 1
fi

# 6. macOS拡張属性ファイル確認
echo "🍎 macOS拡張属性ファイル確認..."
DOT_FILES=$(find . -name "._*" | wc -l)
if [ "$DOT_FILES" -gt 0 ]; then
    echo "⚠️  macOS拡張属性ファイルが $DOT_FILES 個見つかりました"
    echo "   これらはデプロイ時に除外されます"
else
    echo "✅ macOS拡張属性ファイルなし"
fi

# 7. 環境変数確認
echo "🔧 環境変数確認..."
if [ -f ".env.local" ]; then
    echo "✅ .env.local 存在"
else
    echo "⚠️  .env.local が存在しません"
fi

# 8. AWS認証確認
echo "☁️  AWS認証確認..."
if aws sts get-caller-identity > /dev/null 2>&1; then
    echo "✅ AWS認証OK"
    AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
    echo "📊 AWS Account: $AWS_ACCOUNT"
else
    echo "⚠️  AWS認証が設定されていません"
    echo "   IAMロールまたはAWS認証情報を設定してください"
fi

echo "🎉 環境チェック完了"
echo "✅ デプロイ準備完了" 