-- Lightweight presence tracking via heartbeat pings.
-- Active users = rows where last_seen > now() - 2 minutes.

create table if not exists public.heartbeats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_seen timestamptz not null default now()
);

alter table public.heartbeats enable row level security;

-- Any authenticated user can upsert their own heartbeat
create policy "Users can upsert own heartbeat"
on public.heartbeats for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

grant select, insert, update on public.heartbeats to authenticated;

-- Admins can read all heartbeats (for active user count)
create policy "Admins can read all heartbeats"
on public.heartbeats for select to authenticated
using (public.is_admin());

-- Index for the "active in last 2 min" query
create index heartbeats_last_seen_idx on public.heartbeats (last_seen desc);

-- Cleanup: delete stale heartbeats older than 1 hour (optional cron)
-- This keeps the table small. Run via pg_cron or a scheduled function.
