-- ================================================================================
-- テスト用シードデータ
-- ================================================================================
-- このファイルはローカル開発およびテスト環境で使用するテストデータを定義します
-- 各テストはこのデータを参照することで、テストごとのデータ作成処理を削減できます
--
-- 使い方:
--   supabase db reset (マイグレーション実行後、自動的に seed.sql が実行されます)
--   または
--   psql -d postgres -f supabase/seed.sql
--
-- データ命名規則:
--   - ID: seed-{domain}-{purpose}-{連番}
--   - Email: seed-{purpose}@test.example.com
--   例: seed-user-guest-001, seed-guest-001@test.example.com
-- ================================================================================

-- ================================================================================
-- エリアマスタ
-- ================================================================================
INSERT INTO areas (id, name) VALUES
  ('seed-area-shibuya', '渋谷'),
  ('seed-area-shinjuku', '新宿'),
  ('seed-area-roppongi', '六本木'),
  ('seed-area-ginza', '銀座');

-- ================================================================================
-- ゲストユーザー (user_role = 'guest')
-- ================================================================================
-- 基本的なゲストユーザー（プロフィール登録済み）
INSERT INTO users (id, email, email_verified, role, created_at, updated_at) VALUES
  ('seed-user-guest-001', 'seed-guest-001@test.example.com', NULL, 'guest', NOW(), NOW()),
  ('seed-user-guest-002', 'seed-guest-002@test.example.com', NULL, 'guest', NOW(), NOW()),
  ('seed-user-guest-003', 'seed-guest-003@test.example.com', NULL, 'guest', NOW(), NOW());

INSERT INTO user_profiles (id, name, birth_date, created_at, updated_at) VALUES
  ('seed-user-guest-001', '田中太郎', '1990-05-15', NOW(), NOW()),
  ('seed-user-guest-002', '佐藤一郎', '1985-08-20', NOW(), NOW()),
  ('seed-user-guest-003', '鈴木次郎', '1995-03-10', NOW(), NOW());

-- LINEアカウント連携済みゲスト
INSERT INTO accounts (user_id, type, provider, provider_account_id) VALUES
  ('seed-user-guest-001', 'oauth', 'line', 'seed-line-guest-001'),
  ('seed-user-guest-002', 'oauth', 'line', 'seed-line-guest-002');

-- プロフィール未登録のゲスト（認証のみ完了）
INSERT INTO users (id, email, email_verified, role, created_at, updated_at) VALUES
  ('seed-user-guest-no-profile', 'seed-guest-no-profile@test.example.com', NULL, NULL, NOW(), NOW());

INSERT INTO accounts (user_id, type, provider, provider_account_id) VALUES
  ('seed-user-guest-no-profile', 'oauth', 'line', 'seed-line-guest-no-profile');

-- ================================================================================
-- キャストユーザー (user_role = 'cast')
-- ================================================================================
-- アクティブなキャスト（プロフィール登録済み、is_active=true）
INSERT INTO users (id, email, email_verified, role, created_at, updated_at) VALUES
  ('seed-user-cast-001', 'seed-cast-001@test.example.com', NULL, 'cast', NOW(), NOW()),
  ('seed-user-cast-002', 'seed-cast-002@test.example.com', NULL, 'cast', NOW(), NOW()),
  ('seed-user-cast-003', 'seed-cast-003@test.example.com', NULL, 'cast', NOW(), NOW()),
  ('seed-user-cast-004', 'seed-cast-004@test.example.com', NULL, 'cast', NOW(), NOW()),
  ('seed-user-cast-005', 'seed-cast-005@test.example.com', NULL, 'cast', NOW(), NOW());

INSERT INTO user_profiles (id, name, birth_date, created_at, updated_at) VALUES
  ('seed-user-cast-001', '山田花子', '1998-04-12', NOW(), NOW()),
  ('seed-user-cast-002', '佐々木美咲', '1997-11-23', NOW(), NOW()),
  ('seed-user-cast-003', '高橋彩', '1999-07-08', NOW(), NOW()),
  ('seed-user-cast-004', '伊藤舞', '1996-02-14', NOW(), NOW()),
  ('seed-user-cast-005', '渡辺優奈', '2000-09-30', NOW(), NOW());

INSERT INTO cast_profiles (id, bio, rank, area_id, is_active, created_at, updated_at) VALUES
  ('seed-user-cast-001', 'よろしくお願いします！楽しい時間を過ごしましょう♪', 1, 'seed-area-shibuya', TRUE, NOW(), NOW()),
  ('seed-user-cast-002', 'お酒が大好きです！いろんなお店を知っています', 2, 'seed-area-shinjuku', TRUE, NOW(), NOW()),
  ('seed-user-cast-003', 'ゆっくりお話ししましょう', 1, 'seed-area-roppongi', TRUE, NOW(), NOW()),
  ('seed-user-cast-004', 'カラオケ大好きです🎤', 3, 'seed-area-ginza', TRUE, NOW(), NOW()),
  ('seed-user-cast-005', '明るく元気に頑張ります！', 1, NULL, TRUE, NOW(), NOW());

-- LINEアカウント連携済みキャスト
INSERT INTO accounts (user_id, type, provider, provider_account_id) VALUES
  ('seed-user-cast-001', 'oauth', 'line', 'seed-line-cast-001'),
  ('seed-user-cast-002', 'oauth', 'line', 'seed-line-cast-002'),
  ('seed-user-cast-003', 'oauth', 'line', 'seed-line-cast-003'),
  ('seed-user-cast-004', 'oauth', 'line', 'seed-line-cast-004'),
  ('seed-user-cast-005', 'oauth', 'line', 'seed-line-cast-005');

-- 非アクティブなキャスト（テスト用: is_active=false）
INSERT INTO users (id, email, email_verified, role, created_at, updated_at) VALUES
  ('seed-user-cast-inactive', 'seed-cast-inactive@test.example.com', NULL, 'cast', NOW(), NOW());

INSERT INTO user_profiles (id, name, birth_date, created_at, updated_at) VALUES
  ('seed-user-cast-inactive', '非アクティブキャスト', '1998-01-01', NOW(), NOW());

INSERT INTO cast_profiles (id, bio, rank, area_id, is_active, created_at, updated_at) VALUES
  ('seed-user-cast-inactive', '現在休止中', 1, 'seed-area-shibuya', FALSE, NOW(), NOW());

INSERT INTO accounts (user_id, type, provider, provider_account_id) VALUES
  ('seed-user-cast-inactive', 'oauth', 'line', 'seed-line-cast-inactive');

-- プロフィール未登録のキャスト（認証のみ完了）
INSERT INTO users (id, email, email_verified, role, created_at, updated_at) VALUES
  ('seed-user-cast-no-profile', 'seed-cast-no-profile@test.example.com', NULL, NULL, NOW(), NOW());

INSERT INTO accounts (user_id, type, provider, provider_account_id) VALUES
  ('seed-user-cast-no-profile', 'oauth', 'line', 'seed-line-cast-no-profile');

-- ================================================================================
-- ページネーションテスト用キャスト（20件）
-- ================================================================================
INSERT INTO users (id, email, email_verified, role, created_at, updated_at)
SELECT
  'seed-user-cast-page-' || LPAD(n::text, 3, '0'),
  'seed-cast-page-' || LPAD(n::text, 3, '0') || '@test.example.com',
  NULL,
  'cast',
  NOW(),
  NOW()
FROM generate_series(1, 20) AS n;

INSERT INTO user_profiles (id, name, birth_date, created_at, updated_at)
SELECT
  'seed-user-cast-page-' || LPAD(n::text, 3, '0'),
  'ページネーションキャスト' || n,
  '1995-01-01',
  NOW(),
  NOW()
FROM generate_series(1, 20) AS n;

INSERT INTO cast_profiles (id, bio, rank, area_id, is_active, created_at, updated_at)
SELECT
  'seed-user-cast-page-' || LPAD(n::text, 3, '0'),
  'ページネーションテスト用',
  n, -- ランクは連番
  CASE
    WHEN n % 4 = 1 THEN 'seed-area-shibuya'
    WHEN n % 4 = 2 THEN 'seed-area-shinjuku'
    WHEN n % 4 = 3 THEN 'seed-area-roppongi'
    ELSE NULL
  END,
  TRUE,
  NOW(),
  NOW()
FROM generate_series(1, 20) AS n;

INSERT INTO accounts (user_id, type, provider, provider_account_id)
SELECT
  'seed-user-cast-page-' || LPAD(n::text, 3, '0'),
  'oauth',
  'line',
  'seed-line-cast-page-' || LPAD(n::text, 3, '0')
FROM generate_series(1, 20) AS n;

-- ================================================================================
-- エッジケーステスト用データ
-- ================================================================================
-- bioが空文字のキャスト
INSERT INTO users (id, email, email_verified, role, created_at, updated_at) VALUES
  ('seed-user-cast-empty-bio', 'seed-cast-empty-bio@test.example.com', NULL, 'cast', NOW(), NOW());

INSERT INTO user_profiles (id, name, birth_date, created_at, updated_at) VALUES
  ('seed-user-cast-empty-bio', 'Bio空白キャスト', '1998-01-01', NOW(), NOW());

INSERT INTO cast_profiles (id, bio, rank, area_id, is_active, created_at, updated_at) VALUES
  ('seed-user-cast-empty-bio', '', 1, NULL, TRUE, NOW(), NOW());

INSERT INTO accounts (user_id, type, provider, provider_account_id) VALUES
  ('seed-user-cast-empty-bio', 'oauth', 'line', 'seed-line-cast-empty-bio');

-- ================================================================================
-- 認証テスト用データ
-- ================================================================================
-- 異なるプロバイダーのアカウント（Googleアカウント）
INSERT INTO users (id, email, email_verified, role, created_at, updated_at) VALUES
  ('seed-user-google-001', 'seed-google-001@test.example.com', NULL, 'guest', NOW(), NOW());

INSERT INTO user_profiles (id, name, birth_date, created_at, updated_at) VALUES
  ('seed-user-google-001', 'Googleユーザー', '1990-01-01', NOW(), NOW());

INSERT INTO accounts (user_id, type, provider, provider_account_id) VALUES
  ('seed-user-google-001', 'oauth', 'google', 'seed-google-account-001');

-- ================================================================================
-- E2Eテスト用データ（開発環境Credentialsプロバイダー用）
-- ================================================================================
-- E2Eテスト用ゲストユーザー
-- パスワード: dev-password-2024 (bcryptでハッシュ化)
INSERT INTO users (id, email, email_verified, password, role, created_at, updated_at) VALUES
  ('seed-user-e2e-guest', 'test-guest@example.com', NULL, '$2b$10$firb/bnF1rS0ohsOTRxNC.4GPmZlgCMcM7cE81r4fB6/tvqAUMN0u', 'guest', NOW(), NOW());

INSERT INTO user_profiles (id, name, birth_date, created_at, updated_at) VALUES
  ('seed-user-e2e-guest', 'E2Eテストゲスト', '1990-01-01', NOW(), NOW());

-- E2Eテスト用キャストユーザー
-- パスワード: dev-password-2024 (bcryptでハッシュ化)
INSERT INTO users (id, email, email_verified, password, role, created_at, updated_at) VALUES
  ('seed-user-e2e-cast', 'test-cast@example.com', NULL, '$2b$10$firb/bnF1rS0ohsOTRxNC.4GPmZlgCMcM7cE81r4fB6/tvqAUMN0u', 'cast', NOW(), NOW());

INSERT INTO user_profiles (id, name, birth_date, created_at, updated_at) VALUES
  ('seed-user-e2e-cast', 'E2Eテストキャスト', '1995-06-15', NOW(), NOW());

INSERT INTO cast_profiles (id, bio, rank, area_id, is_active, created_at, updated_at) VALUES
  ('seed-user-e2e-cast', 'E2Eテスト用キャストです', 1, 'seed-area-shibuya', TRUE, NOW(), NOW());

-- ================================================================================
-- キャストプロフィール写真テスト用データ
-- ================================================================================
-- seed-user-cast-001: 3枚の写真（表示順テスト用）
INSERT INTO cast_profile_photos (id, cast_profile_id, photo_url, display_order, created_at, updated_at) VALUES
  ('seed-photo-cast-001-1', 'seed-user-cast-001', 'seed-user-cast-001/photo1.jpg', 0, NOW(), NOW()),
  ('seed-photo-cast-001-2', 'seed-user-cast-001', 'seed-user-cast-001/photo2.jpg', 1, NOW(), NOW()),
  ('seed-photo-cast-001-3', 'seed-user-cast-001', 'seed-user-cast-001/photo3.jpg', 2, NOW(), NOW());

-- seed-user-cast-002: 1枚の写真
INSERT INTO cast_profile_photos (id, cast_profile_id, photo_url, display_order, created_at, updated_at) VALUES
  ('seed-photo-cast-002-1', 'seed-user-cast-002', 'seed-user-cast-002/photo1.jpg', 0, NOW(), NOW());

-- seed-user-cast-003: 写真なし（テスト用）

-- ページネーション用キャスト: 各1枚の写真
INSERT INTO cast_profile_photos (id, cast_profile_id, photo_url, display_order, created_at, updated_at)
SELECT
  'seed-photo-page-' || LPAD(n::text, 3, '0') || '-1',
  'seed-user-cast-page-' || LPAD(n::text, 3, '0'),
  'seed-user-cast-page-' || LPAD(n::text, 3, '0') || '/photo1.jpg',
  0,
  NOW(),
  NOW()
FROM generate_series(1, 20) AS n;

-- ================================================================================
-- 完了
-- ================================================================================
-- データ挿入が完了しました
-- 以下のデータが利用可能です:
-- - ゲストユーザー: 4件（プロフィール登録済み3件、未登録1件）
-- - キャストユーザー: 27件（アクティブ25件、非アクティブ1件、未登録1件）
-- - エリア: 4件
-- - ページネーション用キャスト: 20件
-- - キャストプロフィール写真: 24件（メイン4件 + ページネーション20件）

-- ================================================================================
-- マッチング (matchings + matching_participants)
-- ================================================================================
-- ゲスト seed-user-guest-001 のマッチング
INSERT INTO matchings (id, type, guest_id, chat_room_id, status, proposed_date, proposed_duration, proposed_location, requested_cast_count, total_points, created_at, updated_at) VALUES
  ('seed-matching-pending-001', 'solo', 'seed-user-guest-001', NULL, 'pending', NOW() + INTERVAL '1 day', 120, '渋谷駅周辺', 1, 10000, NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
  ('seed-matching-accepted-001', 'solo', 'seed-user-guest-001', NULL, 'accepted', NOW() + INTERVAL '2 days', 90, '新宿駅周辺', 1, 9000, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 30 minutes'),
  ('seed-matching-rejected-001', 'solo', 'seed-user-guest-001', NULL, 'rejected', NOW() + INTERVAL '3 days', 60, '六本木駅周辺', 1, 7000, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 30 minutes'),
  ('seed-matching-cancelled-001', 'solo', 'seed-user-guest-001', NULL, 'cancelled', NOW() + INTERVAL '4 days', 180, '銀座駅周辺', 1, 12000, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 hours 30 minutes');

INSERT INTO matching_participants (id, matching_id, cast_id, status, created_at, updated_at) VALUES
  ('seed-participant-pending-001', 'seed-matching-pending-001', 'seed-user-cast-001', 'pending', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),
  ('seed-participant-accepted-001', 'seed-matching-accepted-001', 'seed-user-cast-002', 'accepted', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour 30 minutes'),
  ('seed-participant-rejected-001', 'seed-matching-rejected-001', 'seed-user-cast-003', 'rejected', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 30 minutes'),
  ('seed-participant-cancelled-001', 'seed-matching-cancelled-001', 'seed-user-cast-004', 'rejected', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '3 hours 30 minutes');

-- ゲスト seed-user-guest-002 のマッチング
INSERT INTO matchings (id, type, guest_id, chat_room_id, status, proposed_date, proposed_duration, proposed_location, requested_cast_count, total_points, created_at, updated_at) VALUES
  ('seed-matching-pending-002', 'solo', 'seed-user-guest-002', NULL, 'pending', NOW() + INTERVAL '1 day', 120, '渋谷駅周辺', 1, 10000, NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes');

INSERT INTO matching_participants (id, matching_id, cast_id, status, created_at, updated_at) VALUES
  ('seed-participant-pending-002', 'seed-matching-pending-002', 'seed-user-cast-001', 'pending', NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes');

-- ゲスト seed-user-guest-003 のマッチング（キャスト向けテストデータ）
-- seed-user-cast-001 が受信したマッチング
INSERT INTO matchings (id, type, guest_id, chat_room_id, status, proposed_date, proposed_duration, proposed_location, requested_cast_count, total_points, created_at, updated_at) VALUES
  ('seed-matching-pending-003', 'solo', 'seed-user-guest-003', NULL, 'pending', NOW() + INTERVAL '5 days', 150, '表参道駅周辺', 1, 13750, NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '10 minutes'),
  ('seed-matching-accepted-002', 'solo', 'seed-user-guest-003', NULL, 'accepted', NOW() + INTERVAL '6 days', 180, '恵比寿駅周辺', 1, 18000, NOW() - INTERVAL '1 day', NOW() - INTERVAL '20 hours');

INSERT INTO matching_participants (id, matching_id, cast_id, status, responded_at, created_at, updated_at) VALUES
  ('seed-participant-pending-003', 'seed-matching-pending-003', 'seed-user-cast-001', 'pending', NULL, NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '10 minutes'),
  ('seed-participant-accepted-002', 'seed-matching-accepted-002', 'seed-user-cast-001', 'accepted', NOW() - INTERVAL '20 hours', NOW() - INTERVAL '1 day', NOW() - INTERVAL '20 hours');

-- seed-user-cast-002 が受信したマッチング
INSERT INTO matchings (id, type, guest_id, chat_room_id, status, proposed_date, proposed_duration, proposed_location, requested_cast_count, total_points, created_at, updated_at) VALUES
  ('seed-matching-pending-004', 'solo', 'seed-user-guest-003', NULL, 'pending', NOW() + INTERVAL '7 days', 90, '池袋駅周辺', 1, 7500, NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '5 minutes');

INSERT INTO matching_participants (id, matching_id, cast_id, status, created_at, updated_at) VALUES
  ('seed-participant-pending-004', 'seed-matching-pending-004', 'seed-user-cast-002', 'pending', NOW() - INTERVAL '5 minutes', NOW() - INTERVAL '5 minutes');

-- 完了済みマッチング（評価テスト用）
INSERT INTO matchings (id, type, guest_id, chat_room_id, status, proposed_date, proposed_duration, proposed_location, requested_cast_count, total_points, started_at, scheduled_end_at, actual_end_at, created_at, updated_at) VALUES
  ('seed-matching-completed-001', 'solo', 'seed-user-guest-001', NULL, 'completed', NOW() - INTERVAL '3 days', 120, '渋谷駅周辺', 1, 10000, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '2 hours', NOW() - INTERVAL '3 days' + INTERVAL '2 hours 10 minutes', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days'),
  ('seed-matching-completed-002', 'solo', 'seed-user-guest-001', NULL, 'completed', NOW() - INTERVAL '5 days', 90, '新宿駅周辺', 1, 9000, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '90 minutes', NOW() - INTERVAL '5 days' + INTERVAL '95 minutes', NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days');

INSERT INTO matching_participants (id, matching_id, cast_id, status, joined_at, created_at, updated_at) VALUES
  ('seed-participant-completed-001', 'seed-matching-completed-001', 'seed-user-cast-001', 'completed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days'),
  ('seed-participant-completed-002', 'seed-matching-completed-002', 'seed-user-cast-002', 'completed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days');

