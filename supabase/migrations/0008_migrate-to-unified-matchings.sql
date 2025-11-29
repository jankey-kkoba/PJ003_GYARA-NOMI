-- マイグレーション: ソロマッチングとグループマッチングの統合
-- solo_matchings → matchings + matching_participants への移行

-- ============================================
-- Step 1: 未使用のテーブルを削除
-- ============================================

-- matching_offersの外部キーを削除
ALTER TABLE "matching_offers" DROP CONSTRAINT IF EXISTS "matching_offers_matching_id_matchings_id_fk";
ALTER TABLE "matching_offers" DROP CONSTRAINT IF EXISTS "matching_offers_user_id_users_id_fk";

-- 未使用のmatching_offersテーブルを削除
DROP TABLE IF EXISTS "matching_offers";

-- 未使用の旧matchingsテーブルを削除（外部キーを先に削除）
ALTER TABLE "matchings" DROP CONSTRAINT IF EXISTS "matchings_host_id_users_id_fk";
DROP TABLE IF EXISTS "matchings";

-- ============================================
-- Step 2: matching_typeのenumを作成
-- ============================================

CREATE TYPE "public"."matching_type" AS ENUM('solo', 'group');

-- ============================================
-- Step 3: participant_statusのenumを作成
-- ============================================

CREATE TYPE "public"."participant_status" AS ENUM('pending', 'accepted', 'rejected', 'joined', 'completed');

-- ============================================
-- Step 4: 新しいmatchingsテーブルを作成
-- ============================================

CREATE TABLE "matchings" (
    "id" text PRIMARY KEY NOT NULL,
    "type" "matching_type" NOT NULL,
    "guest_id" text NOT NULL,
    "chat_room_id" text,
    "status" "matching_status" DEFAULT 'pending' NOT NULL,

    -- オファー情報
    "proposed_date" timestamp with time zone NOT NULL,
    "proposed_duration" integer NOT NULL,
    "proposed_location" text NOT NULL,
    "hourly_rate" integer NOT NULL,
    "requested_cast_count" integer DEFAULT 1 NOT NULL,
    "total_points" integer NOT NULL,

    -- ギャラ飲み実施情報
    "started_at" timestamp with time zone,
    "scheduled_end_at" timestamp with time zone,
    "actual_end_at" timestamp with time zone,
    "extension_minutes" integer DEFAULT 0,
    "extension_points" integer DEFAULT 0,

    -- メタ情報
    "recruiting_ended_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- 外部キー制約を追加
ALTER TABLE "matchings" ADD CONSTRAINT "matchings_guest_id_users_id_fk"
    FOREIGN KEY ("guest_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "matchings" ADD CONSTRAINT "matchings_chat_room_id_chat_rooms_id_fk"
    FOREIGN KEY ("chat_room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE no action ON UPDATE no action;

-- ============================================
-- Step 5: matching_participantsテーブルを作成
-- ============================================

CREATE TABLE "matching_participants" (
    "id" text PRIMARY KEY NOT NULL,
    "matching_id" text NOT NULL,
    "cast_id" text NOT NULL,
    "status" "participant_status" DEFAULT 'pending' NOT NULL,

    "responded_at" timestamp with time zone,
    "joined_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,

    CONSTRAINT "matching_participants_matching_id_cast_id_unique" UNIQUE("matching_id", "cast_id")
);

-- 外部キー制約を追加
ALTER TABLE "matching_participants" ADD CONSTRAINT "matching_participants_matching_id_matchings_id_fk"
    FOREIGN KEY ("matching_id") REFERENCES "public"."matchings"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "matching_participants" ADD CONSTRAINT "matching_participants_cast_id_users_id_fk"
    FOREIGN KEY ("cast_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

-- ============================================
-- Step 6: solo_matchingsからmatchingsへデータを移行
-- ============================================

INSERT INTO "matchings" (
    "id",
    "type",
    "guest_id",
    "chat_room_id",
    "status",
    "proposed_date",
    "proposed_duration",
    "proposed_location",
    "hourly_rate",
    "requested_cast_count",
    "total_points",
    "started_at",
    "scheduled_end_at",
    "actual_end_at",
    "extension_minutes",
    "extension_points",
    "recruiting_ended_at",
    "created_at",
    "updated_at"
)
SELECT
    "id",
    'solo'::"matching_type",
    "guest_id",
    "chat_room_id",
    "status",
    "proposed_date",
    "proposed_duration",
    "proposed_location",
    "hourly_rate",
    1,  -- requested_cast_count (ソロは1名)
    "total_points",
    "started_at",
    "scheduled_end_at",
    "actual_end_at",
    "extension_minutes",
    "extension_points",
    "cast_responded_at",  -- recruiting_ended_atとしてcast_responded_atを使用
    "created_at",
    "updated_at"
FROM "solo_matchings";

-- ============================================
-- Step 7: solo_matchingsからmatching_participantsへデータを移行
-- ============================================

INSERT INTO "matching_participants" (
    "id",
    "matching_id",
    "cast_id",
    "status",
    "responded_at",
    "joined_at",
    "created_at",
    "updated_at"
)
SELECT
    gen_random_uuid()::text,
    "id",  -- matching_id = solo_matchings.id
    "cast_id",
    CASE
        WHEN "status" = 'pending' THEN 'pending'::"participant_status"
        WHEN "status" = 'accepted' THEN 'accepted'::"participant_status"
        WHEN "status" = 'rejected' THEN 'rejected'::"participant_status"
        WHEN "status" = 'meeting' THEN 'accepted'::"participant_status"
        WHEN "status" = 'in_progress' THEN 'joined'::"participant_status"
        WHEN "status" = 'completed' THEN 'completed'::"participant_status"
        WHEN "status" = 'cancelled' THEN 'rejected'::"participant_status"
        ELSE 'pending'::"participant_status"
    END,
    "cast_responded_at",  -- responded_at
    "started_at",  -- joined_at（合流した時刻）
    "created_at",
    "updated_at"
FROM "solo_matchings";

-- ============================================
-- Step 8: cast_reviewsの外部キー制約を更新
-- ============================================

-- 旧外部キーを削除
ALTER TABLE "cast_reviews" DROP CONSTRAINT IF EXISTS "cast_reviews_matching_id_solo_matchings_id_fk";

-- 新外部キーを追加（matchingsテーブルを参照）
ALTER TABLE "cast_reviews" ADD CONSTRAINT "cast_reviews_matching_id_matchings_id_fk"
    FOREIGN KEY ("matching_id") REFERENCES "public"."matchings"("id") ON DELETE no action ON UPDATE no action;

-- ============================================
-- Step 9: solo_matchingsテーブルを削除
-- ============================================

-- solo_matchingsの外部キーを削除
ALTER TABLE "solo_matchings" DROP CONSTRAINT IF EXISTS "solo_matchings_guest_id_users_id_fk";
ALTER TABLE "solo_matchings" DROP CONSTRAINT IF EXISTS "solo_matchings_cast_id_users_id_fk";
ALTER TABLE "solo_matchings" DROP CONSTRAINT IF EXISTS "solo_matchings_chat_room_id_chat_rooms_id_fk";

-- solo_matchingsテーブルを削除
DROP TABLE "solo_matchings";

-- ============================================
-- Step 10: インデックスを作成
-- ============================================

CREATE INDEX "matchings_guest_id_idx" ON "matchings" ("guest_id");
CREATE INDEX "matchings_status_idx" ON "matchings" ("status");
CREATE INDEX "matchings_type_idx" ON "matchings" ("type");
CREATE INDEX "matching_participants_matching_id_idx" ON "matching_participants" ("matching_id");
CREATE INDEX "matching_participants_cast_id_idx" ON "matching_participants" ("cast_id");
CREATE INDEX "matching_participants_status_idx" ON "matching_participants" ("status");
