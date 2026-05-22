-- Scale to ~80 players per lobby: one row per finish + Realtime (no JSON blob on lobbies).

create table if not exists public.lobby_results (
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

create index if not exists lobby_results_lobby_id_idx
  on public.lobby_results (lobby_id);

create index if not exists lobby_results_leaderboard_idx
  on public.lobby_results (lobby_id, score desc, time_seconds asc);

alter table public.lobby_results enable row level security;

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

-- Realtime: In Supabase Dashboard → Database → Publications → supabase_realtime,
-- enable tables: lobbies, lobby_players, lobby_results (if SQL below fails).

do $$
begin
  alter publication supabase_realtime add table public.lobby_results;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.lobbies;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.lobby_players;
exception when duplicate_object then null;
end $$;
