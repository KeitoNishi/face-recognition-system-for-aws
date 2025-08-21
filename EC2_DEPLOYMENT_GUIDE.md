# EC2デプロイメントガイド

## 🚀 簡単デプロイ（推奨）

### 1. 安全なデプロイ（環境チェック付き）
```bash
npm run deploy:safe
```

### 2. 直接デプロイ
```bash
npm run deploy
```

### 3. 環境チェックのみ
```bash
npm run check-env
```

## 📋 デプロイ前チェックリスト

### ✅ 自動チェック項目
- [ ] Node.js バージョン確認
- [ ] npm バージョン確認
- [ ] プロジェクトファイル存在確認
- [ ] 依存関係確認
- [ ] ビルドテスト
- [ ] ビルド成果物確認
- [ ] macOS拡張属性ファイル確認
- [ ] 環境変数確認
- [ ] AWS認証確認

### 🔧 手動チェック項目
- [ ] EC2インスタンスが起動中
- [ ] セキュリティグループでポート3000が開放
- [ ] IAMロールが正しく設定
- [ ] Parameter Storeの設定が完了

## 🛡️ 再発防止策

### 1. **macOS拡張属性ファイル対策**
- 圧縮時に`--exclude=._*`で除外
- 展開後に`find . -name '._*' -delete`で削除

### 2. **環境同期**
- Node.js v24.2.0以上
- npm v11.3.0以上
- ローカルとEC2の環境を一致

### 3. **エラーハンドリング**
- 各ステップでエラーチェック
- 失敗時に自動停止
- 詳細なログ出力

### 4. **自動化**
- ワンコマンドデプロイ
- 環境チェック自動化
- クリーンアップ自動化

## 🔧 トラブルシューティング

### よくある問題と解決策

#### 1. ビルドエラー
```bash
# 環境チェック実行
npm run check-env

# 依存関係再インストール
rm -rf node_modules package-lock.json
npm install
```

#### 2. モジュール解決エラー
```bash
# macOS拡張属性ファイル削除
find . -name '._*' -delete

# ビルド再実行
npm run build
```

#### 3. PM2起動エラー
```bash
# PM2再インストール
npm install -g pm2

# プロセス確認
pm2 status
pm2 logs face-recognition-system
```

#### 4. 環境変数エラー
```bash
# Parameter Store確認
aws ssm get-parameter --name "/face-recognition/prod/config"

# 環境変数確認
echo $NODE_ENV
echo $AWS_REGION
```

## 📊 監視・管理

### PM2管理コマンド
```bash
# 状態確認
pm2 status

# ログ確認
pm2 logs face-recognition-system

# 再起動
pm2 restart face-recognition-system

# 停止
pm2 stop face-recognition-system

# 開始
pm2 start face-recognition-system
```

### システム監視
```bash
# メモリ使用量確認
free -h

# ディスク使用量確認
df -h

# プロセス確認
ps aux | grep node
```

## 🌐 アクセス情報

- **URL**: http://52.195.165.233:3000
- **SSH**: `ssh -i /Users/keito/workspace/key-aws/ec2-key-pair.pem ec2-user@52.195.165.233`

## 📝 更新履歴

### v2.0 (2025-08-21)
- ✅ 再発防止策実装
- ✅ 自動環境チェック追加
- ✅ エラーハンドリング強化
- ✅ ワンコマンドデプロイ実現

### v1.0 (2025-08-21)
- ✅ 初回デプロイ完了
- ✅ PM2自動起動設定
- ✅ 基本的な監視機能 