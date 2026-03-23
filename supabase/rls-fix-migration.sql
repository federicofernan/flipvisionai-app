-- FlipVision AI — Fix overly permissive RLS policies
-- Run this in your Supabase SQL Editor
-- Safe to run multiple times (uses DROP POLICY IF EXISTS)

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. properties  (user_id column added in user-scoping-migration.sql)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow all for now" ON properties;

CREATE POLICY "properties: owner select"
  ON properties FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "properties: owner insert"
  ON properties FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "properties: owner update"
  ON properties FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "properties: owner delete"
  ON properties FOR DELETE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. property_photos  (no user_id column; scoped via parent property)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow all for now" ON property_photos;

CREATE POLICY "property_photos: owner select"
  ON property_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_photos.property_id
        AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "property_photos: owner insert"
  ON property_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_photos.property_id
        AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "property_photos: owner update"
  ON property_photos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_photos.property_id
        AND properties.user_id = auth.uid()
    )
  );

CREATE POLICY "property_photos: owner delete"
  ON property_photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_photos.property_id
        AND properties.user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. reports  (user_id column added in user-scoping-migration.sql)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow all for now" ON reports;

CREATE POLICY "reports: owner select"
  ON reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "reports: owner insert"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reports: owner update"
  ON reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "reports: owner delete"
  ON reports FOR DELETE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. prompts  — read-only for any authenticated user; writes via service role only
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow all for now" ON prompts;

CREATE POLICY "prompts: authenticated read"
  ON prompts FOR SELECT
  USING (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. plan_configs  — read-only for any authenticated user; writes via service role only
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow all for now" ON plan_configs;

CREATE POLICY "plan_configs: authenticated read"
  ON plan_configs FOR SELECT
  USING (auth.role() = 'authenticated');
