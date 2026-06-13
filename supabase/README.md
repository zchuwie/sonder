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

Create one email/password user for the administrator, then configure:

```bash
corepack pnpm exec supabase secrets set ADMIN_EMAIL=admin@example.com
corepack pnpm exec supabase secrets set DEEZER_API_BASE_URL=https://api.deezer.com
```

Deploy functions:

```bash
corepack pnpm exec supabase functions deploy create-post
corepack pnpm exec supabase functions deploy report-post
corepack pnpm exec supabase functions deploy deezer-search
corepack pnpm exec supabase functions deploy signed-post-image
corepack pnpm exec supabase functions deploy admin-approve-post
corepack pnpm exec supabase functions deploy admin-reject-post
corepack pnpm exec supabase functions deploy admin-hide-post
```

Local Supabase development requires Docker Desktop. If Docker is unavailable,
link a remote project and push the migrations instead.

## Images

All images remain in the private `post-images` bucket. Object paths start with
the anonymous user's auth ID. Owners can access their own objects through RLS.
Approved public posts receive one-hour signed URLs through
`signed-post-image`. This avoids duplicate pending/public files.

## Admin

The unlinked admin entry route is `/verdant-keeper-7q4m9x`. It is only
obscurity; authorization always compares the authenticated Supabase user's
email to the server-side `ADMIN_EMAIL`.
