-- Migration 003: richer lessons.
-- Stores the target-language cultural note and the country "almanac"
-- (on-this-day / figure / geo fact / holiday) in one jsonb column.

alter table public.lessons add column if not exists lesson_extra jsonb;
