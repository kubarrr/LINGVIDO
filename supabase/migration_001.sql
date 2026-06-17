-- Migration 001: add language_pairs to profiles (for multi-language support)

alter table public.profiles
  add column if not exists language_pairs jsonb not null default '[]';
