-- FlipVision AI — Update room_type enum
-- Run this in your Supabase SQL Editor

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Add new room type values to the existing enum
--    (PostgreSQL allows ADD VALUE IF NOT EXISTS — safe to re-run)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TYPE room_type ADD VALUE IF NOT EXISTS 'half_bathroom';
ALTER TYPE room_type ADD VALUE IF NOT EXISTS 'full_bathroom';
ALTER TYPE room_type ADD VALUE IF NOT EXISTS 'master_bathroom';
ALTER TYPE room_type ADD VALUE IF NOT EXISTS 'backyard';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Migrate existing 'bathroom' photos to 'full_bathroom'
--    (the old 'bathroom' value stays in the enum but will never be inserted
--     by new code — existing rows get upgraded to the closest match)
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE property_photos
SET room_type = 'full_bathroom'
WHERE room_type = 'bathroom';
