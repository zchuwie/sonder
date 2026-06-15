create table public.post_uploads (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  bucket text not null default 'post-images',
  path text not null unique,
  original_name text,
  mime_type text not null,
  size_bytes integer not null check (size_bytes > 0 and size_bytes <= 5242880),
  status text not null default 'temporary'
    check (status in ('temporary', 'attached', 'deleted', 'expired')),
  created_at timestamptz not null default now(),
  attached_at timestamptz,
  expires_at timestamptz not null default (now() + interval '1 hour')
);

alter table public.post_uploads enable row level security;

drop policy if exists "Users upload into own post image folder"
on storage.objects;

drop policy if exists "Users delete own unapproved post images"
on storage.objects;

create policy "Users can read own upload records"
on public.post_uploads for select to authenticated
using (created_by = auth.uid());

revoke insert, update, delete on public.post_uploads from anon, authenticated;

delete from public.post_reports
where id in (
  select id
  from (
    select
      id,
      row_number() over (
        partition by post_id, reported_by
        order by created_at asc, id asc
      ) as duplicate_number
    from public.post_reports
    where reported_by is not null
  ) duplicates
  where duplicate_number > 1
);

create unique index post_reports_post_id_reported_by_unique
on public.post_reports (post_id, reported_by)
where reported_by is not null;

create index post_uploads_cleanup_idx
on public.post_uploads (status, expires_at)
where status = 'temporary';

create or replace function public.create_post_with_upload(
  p_title text,
  p_body text,
  p_lat double precision,
  p_lng double precision,
  p_place_name text,
  p_group_key text,
  p_music jsonb,
  p_created_by uuid,
  p_upload_id uuid default null
)
returns table (post_id uuid, post_status public.post_status)
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_upload public.post_uploads%rowtype;
  created_post public.posts%rowtype;
begin
  if p_upload_id is not null then
    select *
    into selected_upload
    from public.post_uploads
    where id = p_upload_id
      and created_by = p_created_by
      and status = 'temporary'
      and expires_at > now()
    for update;

    if not found then
      raise exception 'upload_unavailable';
    end if;
  end if;

  insert into public.posts (
    title, body, lat, lng, place_name, group_key, image_path, music, status, created_by
  )
  values (
    p_title, p_body, p_lat, p_lng, p_place_name, p_group_key,
    case when p_upload_id is null then null else selected_upload.path end,
    p_music, 'pending', p_created_by
  )
  returning * into created_post;

  if p_upload_id is not null then
    update public.post_uploads
    set status = 'attached', attached_at = now()
    where id = p_upload_id;
  end if;

  return query select created_post.id, created_post.status;
end;
$$;

revoke all on function public.create_post_with_upload(
  text, text, double precision, double precision, text, text, jsonb, uuid, uuid
) from public, anon, authenticated;
grant execute on function public.create_post_with_upload(
  text, text, double precision, double precision, text, text, jsonb, uuid, uuid
) to service_role;
