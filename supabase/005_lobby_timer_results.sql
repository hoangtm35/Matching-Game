-- Lobby timer + temporary results (shown once when time runs out, not in scores table).

alter table public.lobbies
  add column if not exists ends_at timestamptz,
  add column if not exists status text not null default 'active'
    check (status in ('active', 'ended')),
  add column if not exists results jsonb not null default '[]'::jsonb;

-- Backfill ends_at for existing lobbies (5 minutes from now)
update public.lobbies
set ends_at = now() + interval '5 minutes'
where ends_at is null;

drop policy if exists "lobbies_public_update" on public.lobbies;

create policy "lobbies_public_update"
  on public.lobbies for update to anon, authenticated
  using (true)
  with check (true);
