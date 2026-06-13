alter table public.posts enable row level security;
alter table public.post_reports enable row level security;
alter table public.moderation_events enable row level security;
alter table public.music_cache enable row level security;

create policy "Anyone can read visible posts"
on public.posts for select
using (status = 'visible');

create policy "Authenticated users can read own posts"
on public.posts for select to authenticated
using (created_by = auth.uid());

create policy "Authenticated users can report as themselves"
on public.post_reports for insert to authenticated
with check (reported_by = auth.uid());

create policy "Anyone can read music cache"
on public.music_cache for select
using (true);

revoke insert, update, delete on public.posts from anon, authenticated;
revoke select, update, delete on public.post_reports from anon, authenticated;
revoke all on public.moderation_events from anon, authenticated;
revoke insert, update, delete on public.music_cache from anon, authenticated;
