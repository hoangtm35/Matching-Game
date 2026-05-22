-- Run in Supabase SQL Editor if you already ran 001_schema.sql before this update.
-- Adds elapsed game time (seconds) to leaderboard scores.

alter table public.scores
  add column if not exists time_seconds int
  check (time_seconds is null or time_seconds >= 0);
