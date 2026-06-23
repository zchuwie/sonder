-- Move PostGIS from public schema to extensions schema.

drop extension if exists postgis cascade;
create extension postgis schema extensions;

-- Add extensions to search_path so operators (&&) and implicit casts resolve
set local search_path to public, extensions;

-- Recreate the geography column
alter table public.posts
add column if not exists location geography(Point, 4326);

-- Backfill existing rows
update public.posts
set location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
where location is null;

-- Recreate the trigger function
create or replace function public.sync_post_location()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  new.location := ST_SetSRID(ST_MakePoint(new.lng, new.lat), 4326)::geography;
  return new;
end;
$$;

-- Recreate trigger
drop trigger if exists posts_sync_location on public.posts;
create trigger posts_sync_location
before insert or update of lat, lng on public.posts
for each row execute function public.sync_post_location();

-- Recreate spatial index
create index if not exists posts_location_gist_idx
on public.posts using gist(location);

-- Recreate RPC with search_path set so && operator resolves
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
set search_path = public, extensions
as $$
  select *
  from public.posts
  where location && ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)::geography::geometry
    and deleted_at is null
  order by created_at desc
  limit least(lim, 200);
$$;

grant execute on function public.get_posts_in_bounds(
  double precision, double precision, double precision, double precision, int
) to anon, authenticated;
