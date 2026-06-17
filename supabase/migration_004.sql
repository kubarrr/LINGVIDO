-- Migration 004: daily country "almanac" (calendar page).
-- Generated once per day per language pair, reused all day, old days cleaned up.

create table if not exists public.almanacs (
  id uuid default uuid_generate_v4() primary key,
  target_language text not null,
  native_language text not null,
  day date not null,
  content jsonb not null,
  created_at timestamptz not null default now(),
  unique (target_language, native_language, day)
);

alter table public.almanacs enable row level security;

create policy "Almanacs are viewable by everyone"
  on public.almanacs for select using (true);

create policy "Authenticated users can insert almanacs"
  on public.almanacs for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can delete almanacs"
  on public.almanacs for delete using (auth.role() = 'authenticated');

-- lesson_extra column from migration 003 is no longer used; safe to leave.
