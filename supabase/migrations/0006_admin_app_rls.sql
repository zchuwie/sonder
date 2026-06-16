create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

drop policy if exists "Admins can read own admin membership" on public.admin_users;
create policy "Admins can read own admin membership"
on public.admin_users for select to authenticated
using (user_id = auth.uid());

grant select on public.admin_users to authenticated;

drop policy if exists "Admins can read all posts" on public.posts;
create policy "Admins can read all posts"
on public.posts for select to authenticated
using (public.is_admin());

drop policy if exists "Admins can moderate posts" on public.posts;
create policy "Admins can moderate posts"
on public.posts for update to authenticated
using (public.is_admin())
with check (public.is_admin());

grant update (
  status,
  approved_at,
  rejected_at,
  hidden_at,
  moderation_reason
) on public.posts to authenticated;

drop policy if exists "Admins can read reports" on public.post_reports;
create policy "Admins can read reports"
on public.post_reports for select to authenticated
using (public.is_admin());

grant select on public.post_reports to authenticated;

drop policy if exists "Admins can manage reports" on public.post_reports;
create policy "Admins can manage reports"
on public.post_reports for update to authenticated
using (public.is_admin())
with check (public.is_admin());

grant update (status) on public.post_reports to authenticated;

drop policy if exists "Admins can read moderation events" on public.moderation_events;
create policy "Admins can read moderation events"
on public.moderation_events for select to authenticated
using (public.is_admin());

grant select on public.moderation_events to authenticated;

drop policy if exists "Admins can read post images" on storage.objects;
create policy "Admins can read post images"
on storage.objects for select to authenticated
using (
  bucket_id = 'post-images'
  and public.is_admin()
);

create or replace function public.log_post_moderation_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.moderation_events (post_id, action, reason, actor_id)
    values (new.id, new.status::text, new.moderation_reason, auth.uid());
  end if;
  return new;
end;
$$;

revoke all on function public.log_post_moderation_change() from public;

drop trigger if exists posts_log_moderation_change on public.posts;
create trigger posts_log_moderation_change
after update of status on public.posts
for each row
execute function public.log_post_moderation_change();
