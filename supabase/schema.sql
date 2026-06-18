-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  target_language text not null default 'en',
  native_language text not null default 'pl',
  level text not null default 'A1',
  language_pairs jsonb not null default '[]',
  xp integer not null default 0,
  streak integer not null default 0,
  last_lesson_at timestamptz,
  streak_updated_at timestamptz,
  badges text[] not null default '{}',
  lessons_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- Lessons table
create table public.lessons (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  image_url text,
  user_input text,
  input_type text not null default 'photo',
  object_detected text not null,
  target_language text not null,
  native_language text not null,
  level text not null,
  words jsonb not null default '[]',
  constructions jsonb not null default '[]',
  cultural_note text,
  lesson_extra jsonb,
  xp_earned integer not null default 0,
  created_at timestamptz not null default now()
);

-- Daily country almanac ("calendar page"), shared across users per language pair
create table public.almanacs (
  id uuid default uuid_generate_v4() primary key,
  target_language text not null,
  native_language text not null,
  day date not null,
  content jsonb not null,
  created_at timestamptz not null default now(),
  unique (target_language, native_language, day)
);

-- Cached daily quiz per language pair
create table public.quizzes (
  id uuid default uuid_generate_v4() primary key,
  target_language text not null,
  native_language text not null,
  day date not null,
  content jsonb not null,
  created_at timestamptz not null default now(),
  unique (target_language, native_language, day)
);

-- One quiz score per user per language per day (leaderboards)
create table public.quiz_scores (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  day date not null,
  target_language text not null,
  correct integer not null default 0,
  total integer not null default 0,
  xp integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, target_language, day)
);

-- Indexes
create index lessons_user_id_idx on public.lessons(user_id);
create index quiz_scores_created_idx on public.quiz_scores(created_at desc);
create index quiz_scores_user_idx on public.quiz_scores(user_id);
create index lessons_created_at_idx on public.lessons(created_at desc);
create index profiles_xp_idx on public.profiles(xp desc);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.lessons enable row level security;
alter table public.almanacs enable row level security;
alter table public.quizzes enable row level security;
alter table public.quiz_scores enable row level security;

-- Almanac policies (shared content)
create policy "Almanacs are viewable by everyone"
  on public.almanacs for select using (true);
create policy "Authenticated users can insert almanacs"
  on public.almanacs for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can delete almanacs"
  on public.almanacs for delete using (auth.role() = 'authenticated');

-- Quiz policies (shared content)
create policy "Quizzes are viewable by everyone"
  on public.quizzes for select using (true);
create policy "Authenticated users can insert quizzes"
  on public.quizzes for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can delete quizzes"
  on public.quizzes for delete using (auth.role() = 'authenticated');

-- Quiz score policies
create policy "Quiz scores are viewable by everyone"
  on public.quiz_scores for select using (true);
create policy "Users insert their own quiz scores"
  on public.quiz_scores for insert with check (auth.uid() = user_id);

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Lessons policies
create policy "Users can view their own lessons"
  on public.lessons for select using (auth.uid() = user_id);

create policy "Users can insert their own lessons"
  on public.lessons for insert with check (auth.uid() = user_id);

create policy "Users can delete their own lessons"
  on public.lessons for delete using (auth.uid() = user_id);

-- Storage bucket for lesson images
insert into storage.buckets (id, name, public) values ('lesson-images', 'lesson-images', true);

create policy "Anyone can view lesson images"
  on storage.objects for select using (bucket_id = 'lesson-images');

create policy "Authenticated users can upload lesson images"
  on storage.objects for insert with check (
    bucket_id = 'lesson-images' and auth.role() = 'authenticated'
  );

create policy "Users can delete their own lesson images"
  on storage.objects for delete using (
    bucket_id = 'lesson-images' and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Function: auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Leaderboard view (weekly XP)
create or replace view public.leaderboard as
select
  p.id,
  p.username,
  p.avatar_url,
  p.xp,
  p.streak,
  rank() over (order by p.xp desc) as rank
from public.profiles p
order by p.xp desc
limit 100;
