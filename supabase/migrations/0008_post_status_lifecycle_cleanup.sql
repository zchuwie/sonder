alter table public.posts
add column if not exists status_updated_at timestamptz not null default now(),
add column if not exists deleted_at timestamptz,
add column if not exists delete_reason text;

drop function if exists public.create_post_with_upload(
  text, text, double precision, double precision, text, text, jsonb, uuid, uuid
);

drop trigger if exists posts_log_moderation_change on public.posts;
drop function if exists public.log_post_moderation_change();
drop function if exists public.is_visible_post_image(text);

drop policy if exists "Anyone can read visible posts" on public.posts;
drop policy if exists "Anyone can read public posts" on public.posts;
drop policy if exists "Authenticated users can read own posts" on public.posts;
drop policy if exists "Users delete own unapproved post images" on storage.objects;

drop index if exists posts_status_created_at_idx;

alter table public.posts
alter column status type text using status::text;

update public.posts
set
  status = case status
    when 'visible' then 'approved'
    when 'hidden' then 'archived'
    when 'deleted' then 'archived'
    else status
  end,
  deleted_at = case
    when status = 'deleted' and deleted_at is null then now()
    else deleted_at
  end;

drop type if exists public.post_status_new;
create type public.post_status_new as enum (
  'pending',
  'approved',
  'rejected',
  'flagged',
  'archived'
);

alter table public.posts
alter column status drop default;

alter table public.posts
alter column status type public.post_status_new
using status::public.post_status_new;

drop type public.post_status;
alter type public.post_status_new rename to post_status;

alter table public.posts
alter column status set default 'pending'::public.post_status;

alter table public.post_reports
alter column status type text using status::text;

update public.post_reports
set status = case status
  when 'reviewed' then 'resolved'
  else status
end;

drop type if exists public.report_status_new;
create type public.report_status_new as enum (
  'open',
  'reviewing',
  'resolved',
  'dismissed',
  'actioned'
);

alter table public.post_reports
alter column status drop default;

alter table public.post_reports
alter column status type public.report_status_new
using status::public.report_status_new;

drop type public.report_status;
alter type public.report_status_new rename to report_status;

alter table public.post_reports
alter column status set default 'open'::public.report_status;

drop policy if exists "Anyone can read visible posts" on public.posts;
create policy "Anyone can read public posts"
on public.posts for select
using (status in ('approved', 'flagged') and deleted_at is null);

drop policy if exists "Authenticated users can read own posts" on public.posts;

grant update (
  status,
  status_updated_at,
  moderation_reason,
  deleted_at,
  delete_reason
) on public.posts to authenticated;

create or replace function public.is_visible_post_image(object_name text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.posts
    where image_path = object_name
      and status in ('approved', 'flagged')
      and deleted_at is null
  );
$$;

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

  insert into public.moderation_events (post_id, action, actor_id)
  values (created_post.id, 'submitted', p_created_by);

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

create or replace function public.log_post_moderation_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  event_action text;
begin
  if old.deleted_at is null and new.deleted_at is not null then
    event_action := 'deleted';
  elsif old.deleted_at is not null and new.deleted_at is null then
    event_action := 'restored';
  elsif old.status is distinct from new.status then
    event_action := new.status::text;
  else
    return new;
  end if;

  new.status_updated_at := now();

  insert into public.moderation_events (post_id, action, reason, actor_id)
  values (
    new.id,
    event_action,
    coalesce(new.delete_reason, new.moderation_reason),
    auth.uid()
  );
  return new;
end;
$$;

drop trigger if exists posts_log_moderation_change on public.posts;
create trigger posts_log_moderation_change
before update of status, deleted_at on public.posts
for each row
execute function public.log_post_moderation_change();

create or replace function public.log_report_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  event_action text;
begin
  if old.status is not distinct from new.status then
    return new;
  end if;

  event_action := case new.status::text
    when 'dismissed' then 'report_dismissed'
    when 'resolved' then 'report_resolved'
    when 'actioned' then 'report_resolved'
    else null
  end;

  if event_action is not null then
    insert into public.moderation_events (post_id, action, reason, actor_id)
    values (new.post_id, event_action, new.reason, auth.uid());
  end if;

  return new;
end;
$$;

drop trigger if exists post_reports_log_status_change on public.post_reports;
create trigger post_reports_log_status_change
after update of status on public.post_reports
for each row
execute function public.log_report_status_change();

alter table public.posts
drop column if exists approved_at,
drop column if exists rejected_at,
drop column if exists hidden_at,
drop column if exists archived_at;

drop index if exists posts_status_created_at_idx;
create index posts_status_created_at_idx
on public.posts (status, created_at desc)
where deleted_at is null;

create index if not exists posts_deleted_at_idx
on public.posts (deleted_at)
where deleted_at is not null;
