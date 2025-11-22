-- ============================================================
-- Auth.js用にストレージRLSポリシーを修正
-- ============================================================
-- auth.uid()はSupabase Authでのみ動作するため、
-- JWTの'sub'クレームから直接ユーザーIDを取得する

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "authenticated_users_can_view_photos" ON storage.objects;
DROP POLICY IF EXISTS "public_can_view_photos" ON storage.objects;
DROP POLICY IF EXISTS "cast_can_upload_own_photos" ON storage.objects;
DROP POLICY IF EXISTS "cast_can_update_own_photos" ON storage.objects;
DROP POLICY IF EXISTS "cast_can_delete_own_photos" ON storage.objects;

-- ============================================================
-- 新しいポリシー（Auth.js対応）
-- ============================================================

-- 認証済みユーザーは全ての写真を閲覧可能（publicバケットのため）
CREATE POLICY "authenticated_users_can_view_photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'cast-profile-photos');

-- 匿名ユーザーも写真を閲覧可能（publicバケットのため）
CREATE POLICY "public_can_view_photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'cast-profile-photos');

-- キャストは自分のフォルダに写真をアップロード可能
-- auth.uid()の代わりにJWTの'sub'クレームを使用
CREATE POLICY "cast_can_upload_own_photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cast-profile-photos'
  AND (storage.foldername(name))[1] = (current_setting('request.jwt.claims', true)::json ->> 'sub')::text
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = (current_setting('request.jwt.claims', true)::json ->> 'sub')::text
    AND users.role = 'cast'
  )
);

-- キャストは自分の写真を更新可能
CREATE POLICY "cast_can_update_own_photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'cast-profile-photos'
  AND (storage.foldername(name))[1] = (current_setting('request.jwt.claims', true)::json ->> 'sub')::text
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = (current_setting('request.jwt.claims', true)::json ->> 'sub')::text
    AND users.role = 'cast'
  )
)
WITH CHECK (
  bucket_id = 'cast-profile-photos'
  AND (storage.foldername(name))[1] = (current_setting('request.jwt.claims', true)::json ->> 'sub')::text
);

-- キャストは自分の写真を削除可能
CREATE POLICY "cast_can_delete_own_photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'cast-profile-photos'
  AND (storage.foldername(name))[1] = (current_setting('request.jwt.claims', true)::json ->> 'sub')::text
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = (current_setting('request.jwt.claims', true)::json ->> 'sub')::text
    AND users.role = 'cast'
  )
);
