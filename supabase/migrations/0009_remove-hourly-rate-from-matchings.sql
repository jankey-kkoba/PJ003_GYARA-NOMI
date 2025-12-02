-- hourly_rateカラムをmatchingsテーブルから削除
-- 時給はキャストのランクから動的に計算されるため、テーブルに保持する必要がない
-- Issue #75: 時給をマッチングテーブルに保持しておく必要あるか？

ALTER TABLE matchings DROP COLUMN IF EXISTS hourly_rate;
