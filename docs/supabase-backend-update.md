# Supabase Backend Update

## Current state

- Supabase config enables anonymous sign-ins.
- Public web uses anonymous Supabase Auth sessions for posts, image uploads, pending posts, and reports.
- Posts are private by default with `pending` status.
- Public users can read only `visible` posts and their own non-archived posts.
- Images use private `post-images` storage plus signed URLs for approved public posts.
- Admin app is split into `apps/admin` and uses normal Supabase auth, not service-role keys.
- Admin access is controlled by `public.admin_users` and `public.is_admin()` RLS policies.
- Admin can read all posts, read/manage reports, moderate posts, archive/restore posts, read audit history, and read private post images.
- Realtime is enabled for admin tables: `posts`, `post_reports`, `moderation_events`.
- Edge Functions handle protected write paths: `create-post`, `report-post`, `upload-post-image`, `signed-post-image`, `cleanup-orphan-uploads`.

## Database schema

- Extension: `pgcrypto`.
- Enums:
  - `post_status`: `pending`, `visible`, `rejected`, `hidden`, `flagged`.
  - `report_status`: `open`, `reviewed`, `dismissed`, `actioned`.
- `posts`:
  - `id uuid pk default gen_random_uuid()`
  - `title text not null`, length `1..80`
  - `body text not null`, length `1..1000`
  - `lat double precision not null`, range `-90..90`
  - `lng double precision not null`, range `-180..180`
  - `place_name text`
  - `group_key text not null`
  - `image_path text`
  - `music jsonb`
  - `status post_status not null default pending`
  - `created_by uuid -> auth.users(id) on delete set null default auth.uid()`
  - `created_at timestamptz default now()`
  - `updated_at timestamptz default now()`
  - `approved_at timestamptz`
  - `rejected_at timestamptz`
  - `hidden_at timestamptz`
  - `moderation_reason text`
  - `archived_at timestamptz`
- `post_reports`:
  - `id uuid pk default gen_random_uuid()`
  - `post_id uuid not null -> posts(id) on delete cascade`
  - `reason text not null`, length `1..120`
  - `details text`, max `1000`
  - `reported_by uuid -> auth.users(id) on delete set null default auth.uid()`
  - `status report_status not null default open`
  - `created_at timestamptz default now()`
- `moderation_events`:
  - `id uuid pk default gen_random_uuid()`
  - `post_id uuid -> posts(id) on delete set null`
  - `action text not null`
  - `reason text`
  - `actor_id uuid -> auth.users(id) on delete set null`
  - `created_at timestamptz default now()`
- `music_cache`:
  - Deezer cache columns: `provider`, `provider_id`, `title`, `artist`, `album`, `cover_url`, `preview_url`, `deezer_url`, `duration`, `raw`, `created_at`
  - Unique: `(provider, provider_id)`
- `post_uploads`:
  - `id uuid pk default gen_random_uuid()`
  - `created_by uuid not null -> auth.users(id) on delete cascade`
  - `bucket text default post-images`
  - `path text not null unique`
  - `original_name text`
  - `mime_type text not null`
  - `size_bytes integer not null`, max `5 MB`
  - `status text default temporary`, allowed `temporary`, `attached`, `deleted`, `expired`
  - `created_at`, `attached_at`, `expires_at default now() + 1 hour`
- `admin_users`:
  - `user_id uuid pk -> auth.users(id) on delete cascade`
  - `email text not null`
  - `role text not null default admin`
  - `created_at timestamptz default now()`

## Enabled DB properties

- RLS enabled on `posts`, `post_reports`, `moderation_events`, `music_cache`, `post_uploads`, `admin_users`.
- Public read policy: anyone can read `posts` where `status = visible`.
- Authenticated owner read: user can read own `posts` when `archived_at is null`.
- Reports: authenticated users can insert reports as themselves.
- Music cache: anyone can read.
- Admin policies: authenticated admin can read all posts, update moderation fields, read/update reports, read moderation events, read storage images.
- Storage bucket `post-images`: private, max `5 MB`, MIME `image/jpeg`, `image/png`, `image/webp`.
- Realtime publication includes `posts`, `post_reports`, `moderation_events`.
- Triggers:
  - `posts_set_updated_at` updates `updated_at`.
  - `posts_log_moderation_change` logs status/archive changes.
- Indexes:
  - `posts(status, created_at desc)`
  - `posts(created_by, status)`
  - `posts(group_key)`
  - `posts(lat, lng)`
  - `post_reports(status, created_at desc)`
  - `post_reports(post_id, reported_by)` unique where `reported_by is not null`
  - `moderation_events(post_id, created_at desc)`
  - `post_uploads(status, expires_at)` where `status = temporary`
- DB functions:
  - `set_updated_at()`
  - `is_visible_post_image(object_name)`
  - `create_post_with_upload(...)`
  - `is_admin()`
  - `log_post_moderation_change()`

## Supabase project properties

- API enabled on port `54321`.
- DB major version `17`, local port `54322`.
- Studio enabled on port `54323`.
- API schemas: `public`, `storage`, `graphql_public`.
- Auth enabled.
- Anonymous sign-ins enabled.
- Auth site URL: `http://localhost:3000`.
- Auth redirect URLs: `http://localhost:3000/**`.
- Storage enabled.
- Global storage file size limit: `5MiB`.
- Edge Function JWT settings:
  - `create-post`: JWT required.
  - `report-post`: JWT required.
  - `upload-post-image`: JWT required.
  - `deezer-search`: JWT not required.
  - `signed-post-image`: JWT not required.
  - `cleanup-orphan-uploads`: JWT not required, protected by `x-cleanup-secret`.

## Anonymous user flow

- Browser calls `signInAnonymously()`.
- User creates post through `create-post` Edge Function.
- Function validates input, rate-limits by user and IP hash, then calls `create_post_with_upload()`.
- Optional image uploads go through `upload-post-image`, stored under `{user_id}/temporary/...`.
- Attached uploads become `attached`; orphan temporary uploads expire through cleanup function.
- User reports visible post through `report-post`; duplicate reports are blocked by unique index.

## Frontend Edge Function wiring

- `create-post`: used by `MapExperience` through `createSupabasePost()`. On success, frontend adds local pending post using returned `postId`.
- `upload-post-image`: used before `create-post` when draft has an image. Frontend validates MIME/size first, backend validates bytes again.
- `report-post`: used by `ReportPostButton`. Duplicate report response becomes reported state instead of hard failure.
- `signed-post-image`: used by post mappers and server post lookup to turn private `image_path` into displayable image URL. Function only signs `visible` posts.
- `deezer-search`: fallback path only. Frontend first calls `/api/music/search`; if website route fails, it invokes Supabase function.
- `cleanup-orphan-uploads`: no frontend call. Cron/server-only function.

## Frontend behavior

- Public map fetches `posts` directly with anon session. RLS decides returned rows: visible posts plus current anonymous user's own non-archived posts.
- Pending posts appear in "My thoughts" because same anonymous session can read its own pending rows.
- Public map hides non-visible posts from public marker groups.
- Share/detail pages request only visible posts and use signed images.
- If Supabase is missing/unavailable, post load/create/report paths fail softly or show user-facing error.

## Admin flow

- Admin signs in with email/password.
- Admin UUID must exist in `public.admin_users`.
- Admin app checks membership before protected routes.
- Admin UI queries Supabase directly with user session.
- RLS allows admin reads/updates only when `public.is_admin()` returns true.
- Moderation changes insert audit records through `posts_log_moderation_change`.

## Backend risks / fixes

- Need regenerate Supabase types after migrations. Web/admin type files look out of sync with latest tables/functions.
- Need verify `public.is_admin()` works in production RLS without recursion or owner/RLS issue.
- Need apply migrations `0006_admin_app_rls.sql` and `0007_admin_realtime_and_archiving.sql` before admin deploy.
- Need add real admin Auth UUID to `public.admin_users`.
- Need set Edge Function secrets: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RATE_LIMIT_SALT`, `CLEANUP_SECRET`, `IS_DEVELOPMENT=false`.
- Need deploy functions after migration push.
- Need schedule hourly cleanup for expired temporary uploads.
- Need confirm no service-role key exists in web/admin envs.
- Need decide if `deezer-search` Edge Function still needed, because Next API route is primary path now.
- Need add frontend smoke test for failed Edge Function responses: expired upload, duplicate report, rate-limit, unauthenticated session.

## Recommended next update

1. Push Supabase migrations.
2. Insert admin membership row.
3. Regenerate DB types for web and admin.
4. Deploy Edge Functions.
5. Run admin smoke test: login, view posts, approve/reject, archive/restore, report status update.
6. Run anonymous smoke test: create post, upload image, see pending post, report visible post.
7. Run frontend Edge Function smoke test: create text post, create image post, sign visible image, report duplicate, music fallback.
