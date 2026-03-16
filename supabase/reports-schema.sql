-- FlipVision AI — Reports Schema
-- Run this in your Supabase SQL Editor AFTER schema.sql

-- ─────────────────────────────────────────────
-- 1. Reports table
-- ─────────────────────────────────────────────
create table if not exists reports (
  id                   uuid primary key default gen_random_uuid(),
  property_id          uuid not null references properties(id) on delete cascade,
  rooms                text[] not null default '{}',
  analysis             text not null,
  before_photo_url     text,
  generated_image_url  text,
  renovation_style     text,
  created_at           timestamptz not null default now()
);

-- Run this if the table already exists:
-- alter table reports add column if not exists generated_image_url text;
-- alter table reports add column if not exists before_photo_url text;
-- alter table reports add column if not exists renovation_style text;

create index if not exists reports_property_id_idx on reports(property_id);

-- ─────────────────────────────────────────────
-- 2. Row Level Security
-- ─────────────────────────────────────────────
alter table reports enable row level security;

-- Public read/write for now (replace with auth-based policies when ready)
create policy "Allow all for now" on reports for all using (true) with check (true);
