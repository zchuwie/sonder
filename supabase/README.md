# Sonder Supabase Backend

This folder contains the database schema, RLS policies, private image bucket,
and Edge Functions. The repository is logged into Supabase CLI but is not
currently linked to a project.

## Link and apply

```bash
corepack pnpm exec supabase link --project-ref <sonder-project-ref>
corepack pnpm run supa:db:push
corepack pnpm run supa:types
```

Enable anonymous sign-ins in Supabase Auth before testing submissions.

Create one email/password user for the administrator. After applying migration
`0006_admin_app_rls.sql`, add that user's Auth UUID to `public.admin_users`.

Deploy functions:

```bash
corepack pnpm exec supabase functions deploy create-post
corepack pnpm exec supabase functions deploy report-post
corepack pnpm exec supabase functions deploy deezer-search
corepack pnpm exec supabase functions deploy signed-post-image
corepack pnpm exec supabase functions deploy upload-post-image
corepack pnpm exec supabase functions deploy cleanup-orphan-uploads --no-verify-jwt
```

Local Supabase development requires Docker Desktop. If Docker is unavailable,
link a remote project and push the migrations instead.

## Images

All images remain in the private `post-images` bucket. Object paths start with
the anonymous user's auth ID. Owners can access their own objects through RLS.
Approved public posts receive one-hour signed URLs through
`signed-post-image`. This avoids duplicate pending/public files.

## Admin

Admin UI runs separately from `apps/admin` on port `3002`. Admin reads and
moderation updates use authenticated Supabase queries protected by
`public.is_admin()` RLS policies. No admin Edge Functions or service-role key
are used by the admin app. See `docs/admin-separation.md`.

# Security hardening

Required Edge Function secrets:

```bash
corepack pnpm exec supabase secrets set UPSTASH_REDIS_REST_URL="..." UPSTASH_REDIS_REST_TOKEN="..."
corepack pnpm exec supabase secrets set RATE_LIMIT_SALT="..." CLEANUP_SECRET="..." IS_DEVELOPMENT="false"
```

`IS_DEVELOPMENT=true` bypasses Upstash rate limits. Use only for local/test
projects. Production must use `false`; missing Upstash configuration then fails
closed.

Generate `RATE_LIMIT_SALT` and `CLEANUP_SECRET` separately using 32 random
bytes. Never commit or expose either value:

```powershell
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$bytes = New-Object byte[] 32
$rng.GetBytes($bytes)
$rng.Dispose()
[Convert]::ToBase64String($bytes)
```

Apply migration before deploying frontend that uses controlled image uploads:

```bash
corepack pnpm run supa:db:push
corepack pnpm exec supabase functions deploy upload-post-image
corepack pnpm exec supabase functions deploy cleanup-orphan-uploads --no-verify-jwt
corepack pnpm exec supabase functions deploy create-post
corepack pnpm exec supabase functions deploy report-post
```

Run orphan cleanup hourly using Supabase Cron or external cron:

```bash
curl -X POST \
  -H "x-cleanup-secret: $CLEANUP_SECRET" \
  "$SUPABASE_URL/functions/v1/cleanup-orphan-uploads"
```

Cleanup inspects at most 100 expired temporary uploads per run. Pending and
approved post images stay private and display through signed URLs.

For Supabase Cron, create an hourly HTTP job in Dashboard Integrations:

```text
Schedule: 0 * * * *
Method: POST
URL: https://<project-ref>.supabase.co/functions/v1/cleanup-orphan-uploads
Header: x-cleanup-secret: <CLEANUP_SECRET>
```
