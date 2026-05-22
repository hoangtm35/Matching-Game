-- Step 2: Run once in Supabase SQL Editor (https://supabase.com/dashboard → SQL → New query)
-- Creates tables, indexes, and Row Level Security policies.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.question_sets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_at timestamptz not null default now()
);

create table public.options (
  id uuid primary key default gen_random_uuid(),
  question_set_id uuid not null references public.question_sets (id) on delete cascade,
  side text not null check (side in ('A', 'B')),
  label text not null,
  pair_id uuid not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index options_question_set_id_idx on public.options (question_set_id);

create table public.scores (
  id uuid primary key default gen_random_uuid(),
  player_name text not null check (char_length(trim(player_name)) between 1 and 30),
  score int not null check (score >= 0),
  total_pairs int not null check (total_pairs > 0),
  question_set_id uuid references public.question_sets (id) on delete set null,
  played_at timestamptz not null default now()
);

create index scores_leaderboard_idx on public.scores (score desc, played_at asc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.question_sets enable row level security;
alter table public.options enable row level security;
alter table public.scores enable row level security;

create policy "question_sets_public_read"
  on public.question_sets
  for select
  to anon, authenticated
  using (true);

create policy "options_public_read"
  on public.options
  for select
  to anon, authenticated
  using (true);

create policy "scores_public_read"
  on public.scores
  for select
  to anon, authenticated
  using (true);

create policy "scores_public_insert"
  on public.scores
  for insert
  to anon, authenticated
  with check (
    char_length(trim(player_name)) between 1 and 30
    and score >= 0
    and score <= total_pairs
    and total_pairs > 0
  );
