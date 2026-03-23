-- FlipVision AI — User rate limits table
-- Run this in your Supabase SQL Editor

create table if not exists user_limits (
  id                          uuid        primary key default gen_random_uuid(),
  user_id                     uuid        not null references auth.users(id) on delete cascade,
  plan                        text        not null default 'free',
  renovation_analysis_limit   int,                           -- null = unlimited
  property_analysis_limit     int,                           -- null = unlimited
  renovation_analysis_used    int         not null default 0,
  property_analysis_used      int         not null default 0,
  expires_at                  timestamptz not null,          -- end of current billing month
  updated_at                  timestamptz not null default now(),
  created_at                  timestamptz not null default now(),
  constraint user_limits_user_id_key unique (user_id)
);

alter table user_limits enable row level security;

create policy "Users can read own limits"
  on user_limits for select
  using (auth.uid() = user_id);

create policy "Users can insert own limits"
  on user_limits for insert
  with check (auth.uid() = user_id);

create policy "Users can update own limits"
  on user_limits for update
  using (auth.uid() = user_id);

create index if not exists user_limits_user_id_idx on user_limits (user_id);
create index if not exists user_limits_expires_at_idx on user_limits (expires_at);
