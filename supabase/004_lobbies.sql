-- Run in Supabase SQL Editor for lobby-based multiplayer.

create table public.lobbies (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(code) = 6),
  host_name text not null check (char_length(trim(host_name)) between 1 and 30),
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

alter table public.scores
  add column if not exists lobby_id uuid references public.lobbies (id) on delete cascade;

create index scores_lobby_id_idx on public.scores (lobby_id);

alter table public.lobbies enable row level security;
alter table public.lobby_players enable row level security;

create policy "lobbies_public_read"
  on public.lobbies for select to anon, authenticated using (true);

create policy "lobbies_public_insert"
  on public.lobbies for insert to anon, authenticated
  with check (char_length(trim(host_name)) between 1 and 30);

create policy "lobby_players_public_read"
  on public.lobby_players for select to anon, authenticated using (true);

create policy "lobby_players_public_insert"
  on public.lobby_players for insert to anon, authenticated
  with check (char_length(trim(player_name)) between 1 and 30);

-- Scores: allow insert with lobby_id (update insert policy)
drop policy if exists "scores_public_insert" on public.scores;

create policy "scores_public_insert"
  on public.scores for insert to anon, authenticated
  with check (
    char_length(trim(player_name)) between 1 and 30
    and score >= 0
    and score <= total_pairs
    and total_pairs > 0
    and lobby_id is not null
  );
