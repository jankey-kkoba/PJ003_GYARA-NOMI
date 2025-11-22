-- ============================================================
-- キャストプロフィール写真機能の追加
-- ============================================================

-- ============================================================
-- cast_profile_photos テーブルの作成
-- ============================================================

CREATE TABLE "cast_profile_photos" (
  "id" text PRIMARY KEY NOT NULL,
  "cast_profile_id" text NOT NULL,
  "photo_url" text NOT NULL,
  "display_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================================
-- 外部キー制約の追加
-- ============================================================

ALTER TABLE "cast_profile_photos"
ADD CONSTRAINT "cast_profile_photos_cast_profile_id_cast_profiles_id_fk"
FOREIGN KEY ("cast_profile_id")
REFERENCES "public"."cast_profiles"("id")
ON DELETE cascade
ON UPDATE no action;

-- ============================================================
-- RLSの有効化とポリシー設定
-- ============================================================

ALTER TABLE cast_profile_photos ENABLE ROW LEVEL SECURITY;

-- ゲストはアクティブなキャストの写真を閲覧可能
CREATE POLICY "guest_can_view_active_cast_photos"
ON cast_profile_photos
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
  cast_profile_id = auth.uid()::text
);

-- キャストは自分のプロフィール写真を追加可能
CREATE POLICY "cast_can_insert_own_photos"
ON cast_profile_photos
FOR INSERT
TO authenticated
WITH CHECK (
  cast_profile_id = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
    AND users.role = 'cast'
  )
);

-- キャストは自分のプロフィール写真を更新可能
CREATE POLICY "cast_can_update_own_photos"
ON cast_profile_photos
FOR UPDATE
TO authenticated
USING (
  cast_profile_id = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
    AND users.role = 'cast'
  )
)
WITH CHECK (
  cast_profile_id = auth.uid()::text
);

-- キャストは自分のプロフィール写真を削除可能
CREATE POLICY "cast_can_delete_own_photos"
ON cast_profile_photos
FOR DELETE
TO authenticated
USING (
  cast_profile_id = auth.uid()::text
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()::text
    AND users.role = 'cast'
  )
);

-- ============================================================
-- インデックスの追加
-- ============================================================

-- cast_profile_id でのクエリを高速化
CREATE INDEX "cast_profile_photos_cast_profile_id_idx"
ON "cast_profile_photos"("cast_profile_id");

-- display_order でのソートを高速化
CREATE INDEX "cast_profile_photos_display_order_idx"
ON "cast_profile_photos"("cast_profile_id", "display_order");
