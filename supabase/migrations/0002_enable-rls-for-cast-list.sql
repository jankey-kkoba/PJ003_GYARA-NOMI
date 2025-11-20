-- ============================================================
-- キャスト一覧機能のRLSポリシー設定
-- ============================================================

-- ============================================================
-- RLSの有効化
-- ============================================================

ALTER TABLE cast_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- cast_profiles テーブルのポリシー
-- ============================================================

-- ゲストはアクティブなキャストプロフィールを閲覧可能
CREATE POLICY "guest_can_view_active_casts"
ON cast_profiles
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
    AND users.role = 'guest'
  )
);

-- キャストは自分のプロフィールを閲覧可能
CREATE POLICY "cast_can_view_own_cast_profile"
ON cast_profiles
FOR SELECT
TO authenticated
USING (id = auth.uid()::text);

-- ============================================================
-- user_profiles テーブルのポリシー
-- ============================================================

-- ゲストはアクティブなキャストのユーザープロフィールを閲覧可能
CREATE POLICY "guest_can_view_active_cast_profiles"
ON user_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
    AND users.role = 'guest'
  )
  AND EXISTS (
    SELECT 1 FROM cast_profiles
    WHERE cast_profiles.id = user_profiles.id
    AND cast_profiles.is_active = true
  )
);

-- ユーザーは自分のプロフィールを閲覧可能
CREATE POLICY "user_can_view_own_profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (id = auth.uid()::text);

-- ============================================================
-- areas テーブルのポリシー
-- ============================================================

-- 認証済みユーザーは全てのエリアを閲覧可能
CREATE POLICY "authenticated_can_view_areas"
ON areas
FOR SELECT
TO authenticated
USING (true);
