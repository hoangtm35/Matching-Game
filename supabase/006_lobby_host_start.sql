-- Host starts the game; leaderboard when all finish OR timer ends.

alter table public.lobbies
  alter column ends_at drop not null;

alter table public.lobbies drop constraint if exists lobbies_status_check;

alter table public.lobbies
  add constraint lobbies_status_check
  check (status in ('waiting', 'playing', 'ended'));

-- Migrate old "active" lobbies to waiting (host must start again)
update public.lobbies
set status = 'waiting', ends_at = null
where status = 'active';
