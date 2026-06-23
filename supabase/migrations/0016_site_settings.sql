-- Site-wide settings (killswitch, feature flags, etc.)
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default 'false'::jsonb,
  updated_at timestamptz not null default now()
);

-- Seed the maintenance_mode flag
insert into public.site_settings (key, value)
values ('maintenance_mode', 'false'::jsonb)
on conflict (key) do nothing;

-- Anyone can read (web middleware needs this), only authenticated admin can write
alter table public.site_settings enable row level security;

create policy "Anyone can read site_settings"
  on public.site_settings for select
  using (true);

create policy "Admins can update site_settings"
  on public.site_settings for update
  using (
    auth.uid() in (select user_id from public.admin_users)
  );
