-- テーブルが存在しない場合のみ作成
CREATE TABLE IF NOT EXISTS venues (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS photos (
  id SERIAL PRIMARY KEY,
  venue_id INTEGER NOT NULL REFERENCES venues(id),
  filename VARCHAR(255) NOT NULL,
  s3_key VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  photo_path VARCHAR(255) NOT NULL,
  face_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_photos_venue_id ON photos(venue_id);
CREATE INDEX IF NOT EXISTS idx_users_face_id ON users(face_id);

-- サンプルデータ（開発環境用）
INSERT INTO venues (name, created_at)
VALUES 
  ('第1回学会', NOW() - INTERVAL '30 days'),
  ('第2回学会', NOW() - INTERVAL '15 days'),
  ('第3回学会', NOW())
ON CONFLICT DO NOTHING;
