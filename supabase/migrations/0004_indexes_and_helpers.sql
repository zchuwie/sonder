create index posts_status_created_at_idx on public.posts (status, created_at desc);
create index posts_created_by_status_idx on public.posts (created_by, status);
create index posts_group_key_idx on public.posts (group_key);
create index posts_lat_lng_idx on public.posts (lat, lng);
create index post_reports_status_created_at_idx on public.post_reports (status, created_at desc);
create index moderation_events_post_id_idx on public.moderation_events (post_id, created_at desc);

create or replace function public.is_visible_post_image(object_name text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.posts
    where image_path = object_name and status = 'visible'
  );
$$;

revoke all on function public.is_visible_post_image(text) from public;
grant execute on function public.is_visible_post_image(text) to service_role;
