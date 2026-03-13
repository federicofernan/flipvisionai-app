-- FlipVision AI — Auth & Profiles Schema
-- Run this in your Supabase SQL Editor AFTER schema.sql

-- ─────────────────────────────────────────────
-- 1. Profiles table (extends auth.users)
-- ─────────────────────────────────────────────
create table if not exists profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  email            text not null,
  first_name       text not null default '',
  last_name        text not null default '',
  address_line_1   text,
  address_line_2   text,
  state            text,
  country          text,
  selected_plan    text not null default 'free'
                   check (selected_plan in ('free', 'pro', 'investor')),
  account_created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 2. Row Level Security
-- ─────────────────────────────────────────────
alter table profiles enable row level security;

create policy "Users can read own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- ─────────────────────────────────────────────
-- 3. Google OAuth — redirect URL reminder
-- ─────────────────────────────────────────────
-- In Supabase Dashboard → Authentication → URL Configuration, add:
--   Site URL:      http://localhost:3000          (dev)
--   Redirect URLs: http://localhost:3000/auth/callback
--
-- For production, replace with your real domain.
--
-- To enable Google provider:
--   Dashboard → Authentication → Providers → Google → enable & add credentials
--
-- To disable email confirmation (recommended for dev):
--   Dashboard → Authentication → Email → Confirm email → OFF
