-- ============================================================
-- キャストプロフィール写真ストレージの設定
-- ============================================================

-- ============================================================
-- ストレージバケットの作成
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('cast-profile-photos', 'cast-profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- storage.objects テーブルに対するRLSポリシー設定
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
CREATE POLICY "cast_can_upload_own_photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cast-profile-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
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
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
    AND users.role = 'cast'
  )
)
WITH CHECK (
  bucket_id = 'cast-profile-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- キャストは自分の写真を削除可能
CREATE POLICY "cast_can_delete_own_photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'cast-profile-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
    AND users.role = 'cast'
  )
);
