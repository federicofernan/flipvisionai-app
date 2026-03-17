-- FlipVision AI — Admin schema
-- Run this in your Supabase SQL Editor

-- ─────────────────────────────────────────────
-- 1. Add is_admin column to profiles
-- ─────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- ─────────────────────────────────────────────
-- 2. Plan configs table (editable via admin UI)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plan_configs (
  id                        TEXT PRIMARY KEY,          -- 'free' | 'pro' | 'investor'
  name                      TEXT NOT NULL,
  price                     TEXT NOT NULL,             -- display string e.g. 'Free', '$19'
  billing                   TEXT NOT NULL,             -- display string e.g. 'per month'
  report_limit              INTEGER,                   -- NULL = unlimited
  property_analysis_limit   INTEGER,                   -- NULL = unlimited
  stripe_price_id           TEXT,
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE plan_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for now" ON plan_configs FOR ALL USING (true) WITH CHECK (true);

-- Seed with current plan values (no-op if already present)
INSERT INTO plan_configs (id, name, price, billing, report_limit, property_analysis_limit, stripe_price_id)
VALUES
  ('free',     'Free',     'Free', 'Forever',             2,    2,    NULL),
  ('pro',      'Pro',      '$19',  'per month',           NULL, NULL, 'price_pro_monthly'),
  ('investor', 'Investor', '$49',  'per month',           NULL, NULL, 'price_investor_monthly')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- 3. Create the admin user
-- ─────────────────────────────────────────────
-- DO NOT insert directly into auth.users via SQL — GoTrue won't recognise it.
-- Instead, create the user through the Supabase Dashboard:
--   Authentication → Users → Add user → Create new user
--   Email:    admin@flipvisionai.com
--   Password: flipvisionai_admin_20260317
--   ✓ Auto Confirm User
--
-- Then run the two UPDATE statements below to grant admin access.

-- ─────────────────────────────────────────────
-- 4. Grant admin flag (run after creating the user in the Dashboard)
-- ─────────────────────────────────────────────
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"is_admin": true}'::jsonb
WHERE email = 'admin@flipvisionai.com';

UPDATE public.profiles
SET is_admin = TRUE
WHERE email = 'admin@flipvisionai.com';
