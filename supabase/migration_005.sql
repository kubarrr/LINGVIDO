-- Migration 005: daily quiz + quiz-based leaderboard.

-- Cached quiz per language pair per day (like the almanac)
create table if not exists public.quizzes (
  id uuid default uuid_generate_v4() primary key,
  target_language text not null,
  native_language text not null,
  day date not null,
  content jsonb not null,
  created_at timestamptz not null default now(),
  unique (target_language, native_language, day)
);

alter table public.quizzes enable row level security;
create policy "Quizzes are viewable by everyone" on public.quizzes for select using (true);
create policy "Authenticated users can insert quizzes" on public.quizzes for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can delete quizzes" on public.quizzes for delete using (auth.role() = 'authenticated');

-- One score per user per language per day (drives the leaderboards)
create table if not exists public.quiz_scores (
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

alter table public.quiz_scores enable row level security;
create policy "Quiz scores are viewable by everyone" on public.quiz_scores for select using (true);
create policy "Users insert their own quiz scores" on public.quiz_scores for insert with check (auth.uid() = user_id);

create index quiz_scores_created_idx on public.quiz_scores(created_at desc);
create index quiz_scores_user_idx on public.quiz_scores(user_id);
