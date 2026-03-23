-- FlipVision AI — Auto-create user_limits row on sign-up
-- Run this in your Supabase SQL Editor AFTER user-limits-schema.sql

-- ─────────────────────────────────────────────────────────────────────────────
-- Function: creates a user_limits row for every new auth user
-- SECURITY DEFINER so it can write to user_limits bypassing RLS
-- (the new user has no session yet when the trigger fires)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user_limits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_limits (
    user_id,
    plan,
    renovation_analysis_limit,
    property_analysis_limit,
    renovation_analysis_used,
    property_analysis_used,
    expires_at
  ) VALUES (
    NEW.id,
    'free',
    2,                              -- free plan: 2 renovation analyses
    2,                              -- free plan: 2 property analyses
    0,
    0,
    NOW() + INTERVAL '30 days'     -- billing period: 30 days from sign-up
  )
  ON CONFLICT (user_id) DO NOTHING; -- idempotent: never overwrite an existing row

  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger: fires after every new row in auth.users
-- ─────────────────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created_limits ON auth.users;

CREATE TRIGGER on_auth_user_created_limits
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_limits();
