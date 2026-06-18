# Sonder admin app

Sonder admin now runs as a separate Next.js app. Public app contains no admin
dashboard routes. Admin actions use authenticated Supabase queries protected by
RLS; public Edge Functions remain unchanged.

## Run locally

```bash
pnpm --filter web dev
pnpm --filter admin dev
```

Public web runs on `http://localhost:3000`. Admin runs on
`http://localhost:3002`.

## Apply database policy

Apply `supabase/migrations/0006_admin_app_rls.sql`. Existing admin must have a
row in `public.admin_users` matching its Supabase Auth user ID.

Example, run manually in Supabase SQL Editor with real values:

```sql
insert into public.admin_users (user_id, email)
values ('AUTH_USER_UUID', 'admin@example.com')
on conflict (user_id) do update set email = excluded.email;
```

## Environment

Copy public values from `apps/admin/.env.example` into the admin deployment.
Never add `SUPABASE_SERVICE_ROLE_KEY` to admin or public web environments.

## Deployment

Deploy `apps/web` and `apps/admin` as separate Vercel projects. Set each
project's root directory to its app folder. RLS remains the security boundary;
separate hosting alone is not authorization.
