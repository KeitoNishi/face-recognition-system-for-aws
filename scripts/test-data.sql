-- テストデータ投入スクリプト
-- 注意: 本番環境では実行しないでください

-- 既存データをクリア（開発環境のみ）
TRUNCATE TABLE photos CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE venues RESTART IDENTITY CASCADE;

-- ===== 会場データ =====
INSERT INTO venues (name, created_at) VALUES
  ('医学会2024春季大会', NOW() - INTERVAL '45 days'),
  ('AI・データサイエンス学会', NOW() - INTERVAL '30 days'),
  ('グローバルテックカンファレンス', NOW() - INTERVAL '15 days'),
  ('ベンチャーピッチイベント', NOW() - INTERVAL '7 days'),
  ('クリスマスパーティー2024', NOW() - INTERVAL '3 days'),
  ('新年会2025', NOW() - INTERVAL '1 day'),
  ('研究発表会', NOW());

-- ===== 写真データ =====
-- 会場1: 医学会2024春季大会
INSERT INTO photos (venue_id, filename, s3_key, uploaded_at) VALUES
  (1, 'opening_ceremony.jpg', 'photos/1/1703001234567-opening_ceremony.jpg', NOW() - INTERVAL '45 days'),
  (1, 'keynote_speaker.jpg', 'photos/1/1703001234568-keynote_speaker.jpg', NOW() - INTERVAL '45 days'),
  (1, 'poster_session_1.jpg', 'photos/1/1703001234569-poster_session_1.jpg', NOW() - INTERVAL '45 days'),
  (1, 'poster_session_2.jpg', 'photos/1/1703001234570-poster_session_2.jpg', NOW() - INTERVAL '45 days'),
  (1, 'group_photo_medical.jpg', 'photos/1/1703001234571-group_photo_medical.jpg', NOW() - INTERVAL '45 days'),
  (1, 'reception_party.jpg', 'photos/1/1703001234572-reception_party.jpg', NOW() - INTERVAL '45 days'),
  (1, 'awards_ceremony.jpg', 'photos/1/1703001234573-awards_ceremony.jpg', NOW() - INTERVAL '45 days'),
  (1, 'networking_1.jpg', 'photos/1/1703001234574-networking_1.jpg', NOW() - INTERVAL '45 days'),
  (1, 'networking_2.jpg', 'photos/1/1703001234575-networking_2.jpg', NOW() - INTERVAL '45 days'),
  (1, 'closing_ceremony.jpg', 'photos/1/1703001234576-closing_ceremony.jpg', NOW() - INTERVAL '45 days');

-- 会場2: AI・データサイエンス学会
INSERT INTO photos (venue_id, filename, s3_key, uploaded_at) VALUES
  (2, 'ai_expo_entrance.jpg', 'photos/2/1703501234567-ai_expo_entrance.jpg', NOW() - INTERVAL '30 days'),
  (2, 'deep_learning_workshop.jpg', 'photos/2/1703501234568-deep_learning_workshop.jpg', NOW() - INTERVAL '30 days'),
  (2, 'machine_learning_demo.jpg', 'photos/2/1703501234569-machine_learning_demo.jpg', NOW() - INTERVAL '30 days'),
  (2, 'ai_startup_booth.jpg', 'photos/2/1703501234570-ai_startup_booth.jpg', NOW() - INTERVAL '30 days'),
  (2, 'data_visualization.jpg', 'photos/2/1703501234571-data_visualization.jpg', NOW() - INTERVAL '30 days'),
  (2, 'neural_network_presentation.jpg', 'photos/2/1703501234572-neural_network_presentation.jpg', NOW() - INTERVAL '30 days'),
  (2, 'robotics_showcase.jpg', 'photos/2/1703501234573-robotics_showcase.jpg', NOW() - INTERVAL '30 days'),
  (2, 'panel_discussion.jpg', 'photos/2/1703501234574-panel_discussion.jpg', NOW() - INTERVAL '30 days'),
  (2, 'tech_exhibition.jpg', 'photos/2/1703501234575-tech_exhibition.jpg', NOW() - INTERVAL '30 days'),
  (2, 'ai_competition.jpg', 'photos/2/1703501234576-ai_competition.jpg', NOW() - INTERVAL '30 days'),
  (2, 'hackathon_teams.jpg', 'photos/2/1703501234577-hackathon_teams.jpg', NOW() - INTERVAL '30 days'),
  (2, 'award_winners.jpg', 'photos/2/1703501234578-award_winners.jpg', NOW() - INTERVAL '30 days');

-- 会場3: グローバルテックカンファレンス
INSERT INTO photos (venue_id, filename, s3_key, uploaded_at) VALUES
  (3, 'global_tech_opening.jpg', 'photos/3/1704001234567-global_tech_opening.jpg', NOW() - INTERVAL '15 days'),
  (3, 'startup_pitch_1.jpg', 'photos/3/1704001234568-startup_pitch_1.jpg', NOW() - INTERVAL '15 days'),
  (3, 'startup_pitch_2.jpg', 'photos/3/1704001234569-startup_pitch_2.jpg', NOW() - INTERVAL '15 days'),
  (3, 'venture_capital_panel.jpg', 'photos/3/1704001234570-venture_capital_panel.jpg', NOW() - INTERVAL '15 days'),
  (3, 'investor_meeting.jpg', 'photos/3/1704001234571-investor_meeting.jpg', NOW() - INTERVAL '15 days'),
  (3, 'demo_day.jpg', 'photos/3/1704001234572-demo_day.jpg', NOW() - INTERVAL '15 days'),
  (3, 'business_matching.jpg', 'photos/3/1704001234573-business_matching.jpg', NOW() - INTERVAL '15 days'),
  (3, 'international_speakers.jpg', 'photos/3/1704001234574-international_speakers.jpg', NOW() - INTERVAL '15 days');

-- 会場4: ベンチャーピッチイベント
INSERT INTO photos (venue_id, filename, s3_key, uploaded_at) VALUES
  (4, 'venture_pitch_stage.jpg', 'photos/4/1704501234567-venture_pitch_stage.jpg', NOW() - INTERVAL '7 days'),
  (4, 'entrepreneur_presentation.jpg', 'photos/4/1704501234568-entrepreneur_presentation.jpg', NOW() - INTERVAL '7 days'),
  (4, 'investor_questions.jpg', 'photos/4/1704501234569-investor_questions.jpg', NOW() - INTERVAL '7 days'),
  (4, 'startup_exhibition.jpg', 'photos/4/1704501234570-startup_exhibition.jpg', NOW() - INTERVAL '7 days'),
  (4, 'pitch_winners.jpg', 'photos/4/1704501234571-pitch_winners.jpg', NOW() - INTERVAL '7 days'),
  (4, 'networking_break.jpg', 'photos/4/1704501234572-networking_break.jpg', NOW() - INTERVAL '7 days');

-- 会場5: クリスマスパーティー2024
INSERT INTO photos (venue_id, filename, s3_key, uploaded_at) VALUES
  (5, 'christmas_decoration.jpg', 'photos/5/1735001234567-christmas_decoration.jpg', NOW() - INTERVAL '3 days'),
  (5, 'santa_claus_arrival.jpg', 'photos/5/1735001234568-santa_claus_arrival.jpg', NOW() - INTERVAL '3 days'),
  (5, 'gift_exchange.jpg', 'photos/5/1735001234569-gift_exchange.jpg', NOW() - INTERVAL '3 days'),
  (5, 'christmas_dinner.jpg', 'photos/5/1735001234570-christmas_dinner.jpg', NOW() - INTERVAL '3 days'),
  (5, 'karaoke_time.jpg', 'photos/5/1735001234571-karaoke_time.jpg', NOW() - INTERVAL '3 days'),
  (5, 'group_photo_christmas.jpg', 'photos/5/1735001234572-group_photo_christmas.jpg', NOW() - INTERVAL '3 days'),
  (5, 'cake_cutting.jpg', 'photos/5/1735001234573-cake_cutting.jpg', NOW() - INTERVAL '3 days'),
  (5, 'party_games.jpg', 'photos/5/1735001234574-party_games.jpg', NOW() - INTERVAL '3 days');

-- 会場6: 新年会2025
INSERT INTO photos (venue_id, filename, s3_key, uploaded_at) VALUES
  (6, 'new_year_toast.jpg', 'photos/6/1735701234567-new_year_toast.jpg', NOW() - INTERVAL '1 day'),
  (6, 'traditional_performance.jpg', 'photos/6/1735701234568-traditional_performance.jpg', NOW() - INTERVAL '1 day'),
  (6, 'year_2025_sign.jpg', 'photos/6/1735701234569-year_2025_sign.jpg', NOW() - INTERVAL '1 day'),
  (6, 'resolution_sharing.jpg', 'photos/6/1735701234570-resolution_sharing.jpg', NOW() - INTERVAL '1 day'),
  (6, 'team_bonding.jpg', 'photos/6/1735701234571-team_bonding.jpg', NOW() - INTERVAL '1 day'),
  (6, 'lucky_draw.jpg', 'photos/6/1735701234572-lucky_draw.jpg', NOW() - INTERVAL '1 day');

-- 会場7: 研究発表会
INSERT INTO photos (venue_id, filename, s3_key, uploaded_at) VALUES
  (7, 'research_presentation_1.jpg', 'photos/7/1736001234567-research_presentation_1.jpg', NOW()),
  (7, 'research_presentation_2.jpg', 'photos/7/1736001234568-research_presentation_2.jpg', NOW()),
  (7, 'qa_session.jpg', 'photos/7/1736001234569-qa_session.jpg', NOW()),
  (7, 'research_poster.jpg', 'photos/7/1736001234570-research_poster.jpg', NOW()),
  (7, 'lab_members.jpg', 'photos/7/1736001234571-lab_members.jpg', NOW());

-- ===== ユーザー顔データ（AWS Rekognitionの仮想face_id） =====
INSERT INTO users (name, photo_path, face_id, created_at) VALUES
  ('田中太郎', 'faces/user1/face_sample.jpg', 'arn:aws:rekognition:ap-northeast-1:123456789012:face/tanaka_face_001', NOW() - INTERVAL '40 days'),
  ('佐藤花子', 'faces/user2/face_sample.jpg', 'arn:aws:rekognition:ap-northeast-1:123456789012:face/sato_face_002', NOW() - INTERVAL '35 days'),
  ('鈴木一郎', 'faces/user3/face_sample.jpg', 'arn:aws:rekognition:ap-northeast-1:123456789012:face/suzuki_face_003', NOW() - INTERVAL '30 days'),
  ('高橋美咲', 'faces/user4/face_sample.jpg', 'arn:aws:rekognition:ap-northeast-1:123456789012:face/takahashi_face_004', NOW() - INTERVAL '25 days'),
  ('山田健', 'faces/user5/face_sample.jpg', 'arn:aws:rekognition:ap-northeast-1:123456789012:face/yamada_face_005', NOW() - INTERVAL '20 days'),
  ('渡辺さくら', 'faces/user6/face_sample.jpg', 'arn:aws:rekognition:ap-northeast-1:123456789012:face/watanabe_face_006', NOW() - INTERVAL '15 days'),
  ('伊藤大輔', 'faces/user7/face_sample.jpg', 'arn:aws:rekognition:ap-northeast-1:123456789012:face/ito_face_007', NOW() - INTERVAL '10 days'),
  ('中村あい', 'faces/user8/face_sample.jpg', 'arn:aws:rekognition:ap-northeast-1:123456789012:face/nakamura_face_008', NOW() - INTERVAL '5 days'),
  ('小林誠', 'faces/user9/face_sample.jpg', 'arn:aws:rekognition:ap-northeast-1:123456789012:face/kobayashi_face_009', NOW() - INTERVAL '3 days'),
  ('加藤恵', 'faces/user10/face_sample.jpg', 'arn:aws:rekognition:ap-northeast-1:123456789012:face/kato_face_010', NOW() - INTERVAL '1 day');

-- 統計情報表示
SELECT 
  'venues' as table_name, 
  COUNT(*) as record_count 
FROM venues
UNION ALL
SELECT 
  'photos' as table_name, 
  COUNT(*) as record_count 
FROM photos
UNION ALL
SELECT 
  'users' as table_name, 
  COUNT(*) as record_count 
FROM users;

-- 会場別写真数
SELECT 
  v.name as venue_name,
  COUNT(p.id) as photo_count,
  v.created_at::date as event_date
FROM venues v
LEFT JOIN photos p ON v.id = p.venue_id
GROUP BY v.id, v.name, v.created_at
ORDER BY v.created_at DESC;

-- ===== テスト用認証情報 =====
-- 以下の認証情報でログインテストが可能

/*
【一般ユーザー用】
- URL: http://35.78.69.124:3000/
- 共通パスワード: test2024

【管理者用】
- URL: http://35.78.69.124:3000/admin
- ユーザー名: admin
- パスワード: admin2024

【Parameter Store設定例】
AWS Console -> Systems Manager -> Parameter Store
パラメータ名: /face-recognition/prod/config
タイプ: SecureString
値:
{
  "databaseUrl": "postgresql://face_recognition_user:実際のパスワード@face-recognition-db.c0g12z1wxn1k.ap-northeast-1.rds.amazonaws.com:5432/face_recognition_db",
  "awsAccessKey": "実際のアクセスキー",
  "awsSecretKey": "実際のシークレットキー",
  "s3Bucket": "face-recognition-system-images-gakkai",
  "rekognitionCollectionId": "face-recognition-system",
  "userCommonPassword": "test2024",
  "adminUsername": "admin",
  "adminPassword": "admin2024"
}
*/

COMMIT; 