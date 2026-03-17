-- FlipVision AI — User scoping migration
-- Run this in your Supabase SQL Editor

-- ─────────────────────────────────────────────
-- 1. Add user_id to properties
-- ─────────────────────────────────────────────
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- ─────────────────────────────────────────────
-- 2. Add user_id to reports
-- ─────────────────────────────────────────────
ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- ─────────────────────────────────────────────
-- 3. Backfill reports.user_id from properties
--    (only works after properties.user_id is populated)
-- ─────────────────────────────────────────────
UPDATE reports r
SET user_id = p.user_id
FROM properties p
WHERE r.property_id = p.id
  AND r.user_id IS NULL
  AND p.user_id IS NOT NULL;

-- ─────────────────────────────────────────────
-- 4. Index for fast per-user monthly counts
-- ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS reports_user_id_idx ON reports(user_id);
