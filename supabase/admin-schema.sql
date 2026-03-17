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
-- 3. Create admin user
-- ─────────────────────────────────────────────
-- NOTE: If the admin user already exists, this block will do nothing (ON CONFLICT).
-- The is_admin flag is stored in app_metadata so the middleware can read it from
-- the JWT without an extra DB round-trip.
DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- Only insert if the admin user doesn't already exist
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@flipvisionai.com') THEN
    admin_id := gen_random_uuid();

    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role
    ) VALUES (
      admin_id,
      '00000000-0000-0000-0000-000000000000',
      'admin@flipvisionai.com',
      crypt('flipvisionai_admin_20260317', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"],"is_admin":true}',
      '{"first_name":"Admin"}',
      'authenticated',
      'authenticated'
    );

    -- Required: auth.identities entry so email/password login works
    INSERT INTO auth.identities (
      id,
      user_id,
      provider_id,
      provider,
      identity_data,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      admin_id,
      admin_id,
      'admin@flipvisionai.com',
      'email',
      jsonb_build_object('sub', admin_id::text, 'email', 'admin@flipvisionai.com'),
      NOW(),
      NOW(),
      NOW()
    );

    INSERT INTO public.profiles (id, email, first_name, selected_plan, is_admin)
    VALUES (admin_id, 'admin@flipvisionai.com', 'Admin', 'investor', TRUE);
  END IF;
END $$;

-- ─────────────────────────────────────────────
-- 4. If admin user already existed, patch app_metadata to add is_admin flag
-- ─────────────────────────────────────────────
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"is_admin": true}'::jsonb
WHERE email = 'admin@flipvisionai.com';

UPDATE public.profiles
SET is_admin = TRUE
WHERE email = 'admin@flipvisionai.com';
