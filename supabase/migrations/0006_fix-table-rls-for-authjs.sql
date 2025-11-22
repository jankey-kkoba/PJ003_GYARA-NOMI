-- ============================================================
-- Auth.js用にテーブルRLSポリシーを修正
-- ============================================================
-- auth.uid()はSupabase Authでのみ動作するため、
-- JWTの'sub'クレームから直接ユーザーIDを取得する

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "guest_can_view_active_cast_photos" ON cast_profile_photos;
DROP POLICY IF EXISTS "cast_can_view_own_photos" ON cast_profile_photos;
DROP POLICY IF EXISTS "cast_can_insert_own_photos" ON cast_profile_photos;
DROP POLICY IF EXISTS "cast_can_update_own_photos" ON cast_profile_photos;
DROP POLICY IF EXISTS "cast_can_delete_own_photos" ON cast_profile_photos;

-- ============================================================
-- 新しいポリシー（Auth.js対応）
-- ============================================================

-- ゲストはアクティブなキャストの写真を閲覧可能
CREATE POLICY "guest_can_view_active_cast_photos"
ON cast_profile_photos
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = (current_setting('request.jwt.claims', true)::json ->> 'sub')::text
    AND users.role = 'guest'
  )
  AND EXISTS (
    SELECT 1 FROM cast_profiles
    WHERE cast_profiles.id = cast_profile_photos.cast_profile_id
    AND cast_profiles.is_active = true
  )
);

-- キャストは自分のプロフィール写真を閲覧可能
CREATE POLICY "cast_can_view_own_photos"
ON cast_profile_photos
FOR SELECT
TO authenticated
USING (
  cast_profile_id = (current_setting('request.jwt.claims', true)::json ->> 'sub')::text
);

-- キャストは自分のプロフィール写真を追加可能
CREATE POLICY "cast_can_insert_own_photos"
ON cast_profile_photos
FOR INSERT
TO authenticated
WITH CHECK (
  cast_profile_id = (current_setting('request.jwt.claims', true)::json ->> 'sub')::text
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = (current_setting('request.jwt.claims', true)::json ->> 'sub')::text
    AND users.role = 'cast'
  )
);

-- キャストは自分のプロフィール写真を更新可能
CREATE POLICY "cast_can_update_own_photos"
ON cast_profile_photos
FOR UPDATE
TO authenticated
USING (
  cast_profile_id = (current_setting('request.jwt.claims', true)::json ->> 'sub')::text
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = (current_setting('request.jwt.claims', true)::json ->> 'sub')::text
    AND users.role = 'cast'
  )
)
WITH CHECK (
  cast_profile_id = (current_setting('request.jwt.claims', true)::json ->> 'sub')::text
);

-- キャストは自分のプロフィール写真を削除可能
CREATE POLICY "cast_can_delete_own_photos"
ON cast_profile_photos
FOR DELETE
TO authenticated
USING (
  cast_profile_id = (current_setting('request.jwt.claims', true)::json ->> 'sub')::text
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = (current_setting('request.jwt.claims', true)::json ->> 'sub')::text
    AND users.role = 'cast'
  )
);
