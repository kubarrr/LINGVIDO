-- Migration 002: lessons can come from a photo, voice note, or plain text.
-- Image is now optional; store the user's text/transcript and the input type.

alter table public.lessons alter column image_url drop not null;
alter table public.lessons add column if not exists user_input text;
alter table public.lessons add column if not exists input_type text not null default 'photo';
