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

create table public.lobbies (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) = 6),
  host_name text not null check (char_length(trim(host_name)) between 1 and 30),
  ends_at timestamptz,
  status text not null default 'waiting'
    check (status in ('waiting', 'playing', 'ended')),
  results jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index lobbies_code_idx on public.lobbies (code);

create table public.lobby_players (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null references public.lobbies (id) on delete cascade,
  player_name text not null check (char_length(trim(player_name)) between 1 and 30),
  joined_at timestamptz not null default now(),
  unique (lobby_id, player_name)
);

create index lobby_players_lobby_id_idx on public.lobby_players (lobby_id);

create table public.lobby_results (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid not null references public.lobbies (id) on delete cascade,
  player_name text not null check (char_length(trim(player_name)) between 1 and 30),
  score int not null check (score >= 0),
  total_pairs int not null check (total_pairs > 0),
  time_seconds int not null check (time_seconds >= 0),
  question_set_title text not null default '',
  finished_at timestamptz not null default now(),
  unique (lobby_id, player_name)
);

create index lobby_results_lobby_id_idx on public.lobby_results (lobby_id);
create index lobby_results_leaderboard_idx
  on public.lobby_results (lobby_id, score desc, time_seconds asc);

create table public.scores (
  id uuid primary key default gen_random_uuid(),
  player_name text not null check (char_length(trim(player_name)) between 1 and 30),
  score int not null check (score >= 0),
  total_pairs int not null check (total_pairs > 0),
  question_set_id uuid references public.question_sets (id) on delete set null,
  time_seconds int check (time_seconds is null or time_seconds >= 0),
  lobby_id uuid references public.lobbies (id) on delete cascade,
  played_at timestamptz not null default now()
);

create index scores_leaderboard_idx on public.scores (score desc, played_at asc);
create index scores_lobby_id_idx on public.scores (lobby_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.question_sets enable row level security;
alter table public.options enable row level security;
alter table public.scores enable row level security;
alter table public.lobbies enable row level security;
alter table public.lobby_players enable row level security;
alter table public.lobby_results enable row level security;

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

create policy "lobbies_public_read"
  on public.lobbies for select to anon, authenticated using (true);

create policy "lobbies_public_insert"
  on public.lobbies for insert to anon, authenticated
  with check (char_length(trim(host_name)) between 1 and 30);

create policy "lobbies_public_update"
  on public.lobbies for update to anon, authenticated
  using (true) with check (true);

create policy "lobby_players_public_read"
  on public.lobby_players for select to anon, authenticated using (true);

create policy "lobby_players_public_insert"
  on public.lobby_players for insert to anon, authenticated
  with check (char_length(trim(player_name)) between 1 and 30);

create policy "lobby_results_public_read"
  on public.lobby_results for select to anon, authenticated using (true);

create policy "lobby_results_public_insert"
  on public.lobby_results for insert to anon, authenticated
  with check (
    char_length(trim(player_name)) between 1 and 30
    and score >= 0
    and total_pairs > 0
    and time_seconds >= 0
  );

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
