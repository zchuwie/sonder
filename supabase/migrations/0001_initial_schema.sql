create extension if not exists pgcrypto;

create type public.post_status as enum ('pending', 'visible', 'rejected', 'hidden', 'flagged');
create type public.report_status as enum ('open', 'reviewed', 'dismissed', 'actioned');

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 80),
  body text not null check (char_length(body) between 1 and 1000),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  place_name text,
  group_key text not null,
  image_path text,
  music jsonb,
  status public.post_status not null default 'pending',
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  approved_at timestamptz,
  rejected_at timestamptz,
  hidden_at timestamptz,
  moderation_reason text
);

create table public.post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 120),
  details text check (char_length(details) <= 1000),
  reported_by uuid references auth.users(id) on delete set null default auth.uid(),
  status public.report_status not null default 'open',
  created_at timestamptz not null default now()
);

create table public.moderation_events (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete set null,
  action text not null,
  reason text,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.music_cache (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'deezer',
  provider_id text not null,
  title text not null,
  artist text not null,
  album text,
  cover_url text,
  preview_url text,
  deezer_url text,
  duration integer,
  raw jsonb,
  created_at timestamptz not null default now(),
  unique (provider, provider_id)
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger posts_set_updated_at
before update on public.posts
for each row execute function public.set_updated_at();
