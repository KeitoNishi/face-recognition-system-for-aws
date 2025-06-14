# 🎯 テストデータセットアップガイド

## 📊 概要

本システム用の充実したテストデータセットです。実際のイベント・会場に基づく**58枚の写真**と**10名の顔認識ユーザー**を含みます。

## 🗃️ データ構成

### 会場データ（7件）
- 医学会2024春季大会（45日前）
- AI・データサイエンス学会（30日前）
- グローバルテックカンファレンス（15日前）
- ベンチャーピッチイベント（7日前）
- クリスマスパーティー2024（3日前）
- 新年会2025（1日前）
- 研究発表会（当日）

### 写真データ（58件）
- 各会場5-12枚の写真
- リアルなファイル名（opening_ceremony.jpg、keynote_speaker.jpg等）
- S3キー（photos/1/1703001234567-opening_ceremony.jpg形式）

### 顔認識ユーザー（10件）
- 田中太郎、佐藤花子、鈴木一郎...等
- AWS Rekognition用の仮想face_id
- 顔写真パス（faces/user1/face_sample.jpg等）

## 🔐 認証情報

### 一般ユーザー
```
URL: http://35.78.69.124:3000/
共通パスワード: test2024
```

### 管理者
```
URL: http://35.78.69.124:3000/admin
ユーザー名: admin
パスワード: admin2024
```

## ⚙️ セットアップ手順

### 1. Parameter Store設定
AWS Console → Systems Manager → Parameter Store
```
パラメータ名: /face-recognition/prod/config
タイプ: SecureString
値: config/parameter-store-test.json の内容を使用
```

### 2. 自動セットアップ実行
```bash
chmod +x scripts/setup-test-data.sh
./scripts/setup-test-data.sh
```

### 3. 手動セットアップ（必要に応じて）
```bash
# PostgreSQLクライアントインストール
ssh -i /Users/keito/workspace/key-aws/ec2-key-pair.pem ec2-user@35.78.69.124
sudo dnf install -y postgresql15

# テストデータ投入
scp -i /Users/keito/workspace/key-aws/ec2-key-pair.pem scripts/test-data.sql ec2-user@35.78.69.124:/home/ec2-user/
ssh -i /Users/keito/workspace/key-aws/ec2-key-pair.pem ec2-user@35.78.69.124
export PGPASSWORD="YOUR_DB_PASSWORD"
psql -h face-recognition-db.c0g12z1wxn1k.ap-northeast-1.rds.amazonaws.com -U face_recognition_user -d face_recognition_db -f test-data.sql
```

## 🧪 テスト可能な機能

### ✅ 一般ユーザー機能
- [ ] ログイン（共通パスワード）
- [ ] 会場一覧表示
- [ ] 会場別写真閲覧
- [ ] 顔写真登録
- [ ] 顔認識フィルタリング
- [ ] 写真ダウンロード

### ✅ 管理者機能
- [ ] 管理者ログイン
- [ ] 会場作成・管理
- [ ] 写真アップロード
- [ ] 統計情報表示

### ✅ AWS連携機能
- [ ] S3写真アップロード
- [ ] Rekognition顔認識
- [ ] Parameter Store設定取得
- [ ] 署名付きURL生成

## 📈 データ統計

実行後の統計情報:
```sql
-- テーブル別レコード数
venues: 7件
photos: 58件  
users: 10件

-- 会場別写真数
医学会2024春季大会: 10枚
AI・データサイエンス学会: 12枚
グローバルテックカンファレンス: 8枚
ベンチャーピッチイベント: 6枚
クリスマスパーティー2024: 8枚
新年会2025: 6枚
研究発表会: 5枚
```

## 🔧 トラブルシューティング

### PostgreSQLクライアントエラー
```bash
sudo dnf install -y postgresql15
```

### Parameter Store接続エラー
- AWS認証情報を確認
- IAMロールに必要な権限があるか確認

### データベース接続エラー
- RDSセキュリティグループでEC2からの接続を許可
- データベースパスワードを確認

## 🎮 使用例

```bash
# アプリアクセス
curl http://35.78.69.124:3000/

# API動作確認
curl -X POST http://35.78.69.124:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"test2024"}'
``` 