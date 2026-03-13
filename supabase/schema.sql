-- FlipVision AI — Supabase Schema
-- Run this in your Supabase SQL Editor

-- ─────────────────────────────────────────────
-- 1. Properties table
-- ─────────────────────────────────────────────
create table if not exists properties (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  address     text not null,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 2. Property photos table
-- ─────────────────────────────────────────────
create type room_type as enum (
  'kitchen',
  'bathroom',
  'living_room',
  'bedroom',
  'exterior',
  'other'
);

create table if not exists property_photos (
  id            uuid primary key default gen_random_uuid(),
  property_id   uuid not null references properties(id) on delete cascade,
  storage_path  text not null,
  public_url    text not null,
  room_type     room_type not null default 'other',
  file_name     text not null,
  created_at    timestamptz not null default now()
);

create index if not exists property_photos_property_id_idx
  on property_photos(property_id);

-- ─────────────────────────────────────────────
-- 3. Row Level Security
-- ─────────────────────────────────────────────
alter table properties enable row level security;
alter table property_photos enable row level security;

-- Public read/write for now (replace with auth-based policies when you add auth)
create policy "Allow all for now" on properties for all using (true) with check (true);
create policy "Allow all for now" on property_photos for all using (true) with check (true);

-- ─────────────────────────────────────────────
-- 4. Storage bucket
-- ─────────────────────────────────────────────
-- Run this separately in Supabase Dashboard → Storage → New Bucket
-- Name: property-photos
-- Public: true

insert into storage.buckets (id, name, public)
values ('property-photos', 'property-photos', true)
on conflict (id) do nothing;

-- Storage policy: allow all uploads / reads
create policy "Public read" on storage.objects
  for select using (bucket_id = 'property-photos');

create policy "Authenticated upload" on storage.objects
  for insert with check (bucket_id = 'property-photos');

create policy "Authenticated delete" on storage.objects
  for delete using (bucket_id = 'property-photos');
