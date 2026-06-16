alter table public.posts
add column if not exists archived_at timestamptz;

alter table public.posts
drop column if exists archived_by;

drop policy if exists "Authenticated users can read own posts" on public.posts;
create policy "Authenticated users can read own posts"
on public.posts for select to authenticated
using (created_by = auth.uid() and archived_at is null);

grant update (
  status,
  approved_at,
  rejected_at,
  hidden_at,
  moderation_reason,
  archived_at
) on public.posts to authenticated;

drop trigger if exists posts_set_archive_actor on public.posts;
drop function if exists public.set_post_archive_actor();

create or replace function public.log_post_moderation_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  event_action text;
begin
  if old.archived_at is null and new.archived_at is not null then
    event_action := 'archived';
  elsif old.archived_at is not null and new.archived_at is null then
    event_action := 'restored';
  elsif old.status is distinct from new.status then
    event_action := new.status::text;
  else
    return new;
  end if;

  insert into public.moderation_events (post_id, action, reason, actor_id)
  values (new.id, event_action, new.moderation_reason, auth.uid());
  return new;
end;
$$;

drop trigger if exists posts_log_moderation_change on public.posts;
create trigger posts_log_moderation_change
after update of status, archived_at on public.posts
for each row
execute function public.log_post_moderation_change();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'post_reports'
  ) then
    alter publication supabase_realtime add table public.post_reports;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'moderation_events'
  ) then
    alter publication supabase_realtime add table public.moderation_events;
  end if;
end
$$;
