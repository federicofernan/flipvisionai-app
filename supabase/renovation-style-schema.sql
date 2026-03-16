-- FlipVision AI — Renovation Style Schema
-- Run this in your Supabase SQL Editor

create table if not exists renovation_style (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  label       text not null,
  description text not null,
  sort_order  int  not null default 0
);

alter table renovation_style enable row level security;

create policy "Public read" on renovation_style for select using (true);

insert into renovation_style (name, label, description, sort_order) values
  ('modern_contemporary', 'Modern / Contemporary',
   'The most popular choice in new construction and gut renovations today. Defined by clean horizontal and vertical lines, an open-plan layout, and a restrained palette of whites, grays, and blacks punctuated by a single bold accent material — usually steel, glass, or concrete.',
   1),
  ('minimalist', 'Minimalist',
   'Takes modern a step further by aggressively eliminating visual noise. Every surface is intentional. Storage is concealed behind seamless panels. The payoff: a space that feels larger and calmer than its square footage suggests — a great fit for condos and smaller homes.',
   2),
  ('industrial', 'Industrial',
   'Works especially well in older buildings and loft-style spaces. Instead of hiding structural elements, it makes them the design feature — exposed HVAC, raw concrete, and reclaimed wood shelving give the space an authentic, lived-in character.',
   3),
  ('scandinavian', 'Scandinavian / Nordic',
   'The most livable of the five. Borrows minimalism''s discipline but softens it with warm wood tones, layered textiles, and plants. Highly practical for families — every piece of furniture earns its spot through function and beauty.',
   4),
  ('biophilic', 'Biophilic',
   'The fastest-growing category right now, especially in warm climates like South Florida. Prioritizes natural materials, ventilation, greenery, and water features to actively improve air quality and mental wellbeing — not just aesthetics.',
   5)
on conflict (name) do nothing;
