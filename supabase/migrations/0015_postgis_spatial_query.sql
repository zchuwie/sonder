-- Enable PostGIS (free on all Supabase plans)
create extension if not exists postgis;

-- Add geography column derived from existing lat/lng
alter table public.posts
add column if not exists location geography(Point, 4326);

-- Backfill existing rows
update public.posts
set location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
where location is null;

-- Keep location in sync on insert/update via trigger
create or replace function public.sync_post_location()
returns trigger
language plpgsql as $$
begin
  new.location := ST_SetSRID(ST_MakePoint(new.lng, new.lat), 4326)::geography;
  return new;
end;
$$;

create trigger posts_sync_location
before insert or update of lat, lng on public.posts
for each row execute function public.sync_post_location();

-- Spatial index for fast bounding-box queries
create index if not exists posts_location_gist_idx
on public.posts using gist(location);

-- Drop the old B-tree lat/lng index (GIST supersedes it)
drop index if exists posts_lat_lng_idx;

-- RPC: fetch posts within a bounding box
-- Security: runs as invoker so RLS policies apply.
-- Hard-caps limit to 200 regardless of client input.
create or replace function public.get_posts_in_bounds(
  min_lat double precision,
  min_lng double precision,
  max_lat double precision,
  max_lng double precision,
  lim int default 200
)
returns setof public.posts
language sql
stable
security invoker
as $$
  select *
  from public.posts
  where location && ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)::geography::geometry
    and deleted_at is null
  order by created_at desc
  limit least(lim, 200);
$$;

-- Grant execute to anon and authenticated (RLS still filters rows)
grant execute on function public.get_posts_in_bounds(
  double precision, double precision, double precision, double precision, int
) to anon, authenticated;
