# Sonder — System Architecture

## Overview

Sonder is a place-based anonymous content platform. Users pin thoughts, photos, and songs to real-world locations on an interactive map. An admin panel handles moderation, reporting, and audit history.

---

## Monorepo Structure

```
sonder/
├── apps/
│   ├── web/          → Public map app (port 3000)
│   └── admin/        → Admin moderation dashboard (port 3002)
├── packages/
│   ├── map-config/   → OpenFreeMap style URLs (light/dark)
│   ├── eslint-config/
│   └── typescript-config/
├── supabase/
│   ├── functions/    → Deno edge functions
│   └── migrations/   → Postgres schema migrations (10 files)
├── turbo.json
└── package.json      → pnpm workspaces + Turborepo
```

**Tooling:** pnpm 9, Turborepo, Node ≥18, TypeScript 5.9

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend (web) | Next.js 16, React 19, MapLibre GL, Zustand, Framer Motion, Radix UI / shadcn, Tailwind CSS 4 |
| Frontend (admin) | Next.js 16, React 19, MapLibre GL, Recharts, Tailwind CSS 4 |
| Backend | Supabase (hosted Postgres 17, Auth, Storage, Realtime, Edge Functions) |
| Edge Functions | Deno runtime (Supabase Functions) |
| Maps | OpenFreeMap tile server + MapLibre GL |
| Music | Deezer API (search + preview) |
| Geocoding | Nominatim (reverse geocode) |

---

## Database Schema

### Tables

**posts**
- `id`, `title`, `body`, `lat`, `lng`, `place_name`, `group_key`
- `image_path` (nullable, references Storage)
- `music` (jsonb — title, artist, providerId, previewUrl)
- `status` enum: `pending` | `approved` | `rejected` | `flagged` | `archived`
- `created_by` (references auth.users)
- `deleted_at`, `delete_reason` (soft-delete)
- `status_updated_at`, `moderation_reason`
- Timestamps: `created_at`, `updated_at`, `approved_at`, `rejected_at`

**post_reports**
- `id`, `post_id` (FK → posts), `reason`, `details`
- `reported_by` (references auth.users)
- `status` enum: `open` | `reviewing` | `resolved` | `dismissed` | `actioned`

**moderation_events** (audit log)
- `id`, `post_id` (FK → posts), `action`, `reason`, `actor_id`

**music_cache**
- Deezer track metadata cache (provider_id, title, artist, album, cover_url, preview_url, duration)

**admin_users**
- `user_id` — lookup table for admin authorization

### Storage

- **Bucket:** `post-images` (private, 5 MiB limit, jpeg/png/webp)
- RLS: users can upload/read/delete only within their own `userId/` folder
- Public access via signed URLs (10 min expiry)

---

## Authentication

| Context | Method |
|---------|--------|
| Web app (public) | Anonymous sign-in (Supabase Auth). Session persists in browser. Cached in-memory to avoid repeated auth calls. |
| Admin app | Email/password login. Server-side guard (`requireAdmin`) checks `admin_users` table. Redirects to `/login` or `/unauthorized`. |
| Edge functions | JWT validation via `Authorization` header. Service role key for admin operations. |

---

## Edge Functions (Supabase/Deno)

| Function | Auth | Purpose |
|----------|------|---------|
| `create-post` | JWT | Validates input, rate-limits (5/10min/user, 20/hr/IP), creates post via RPC |
| `upload-post-image` | JWT | Handles image upload to Storage |
| `signed-post-image` | None | Returns a signed URL for a post's image |
| `deezer-search` | None | Proxies Deezer music search API |
| `report-post` | JWT | Submits a user report against a post |
| `cleanup-orphan-uploads` | None | Maintenance — removes unused image uploads |

**Shared utilities** (`_shared/`): CORS, rate limiting, IP hashing, input validation, Supabase client factories, error responses.

---

## API Routes

### Web App (`apps/web`)

| Route | Purpose |
|-------|---------|
| `GET /api/posts` | Fetches approved/flagged posts with signed image URLs (cached 60s) |
| `POST /api/report-post` | Proxy to submit post reports |
| `GET /api/post-image/[postId]` | Image proxy (hides raw Storage URLs from client) |
| `GET /api/music/search` | Deezer search proxy |
| `GET /api/music/track/[trackId]` | Fetch single track metadata |
| `GET /api/places/search` | Place/location search (Nominatim) |
| `GET /api/places/reverse` | Reverse geocoding |

### Admin App (`apps/admin`)

| Route | Purpose |
|-------|---------|
| `GET /api/music/track/[trackId]` | Fetch track preview URL for song playback |

---

## Realtime

The admin app subscribes to Postgres changes via Supabase Realtime:

- **Channels:** `posts`, `post_reports`, `moderation_events`
- **Event:** `*` (all changes on those tables)
- **Behavior:** Debounced (200ms) refresh of the current view's data

This keeps the dashboard, moderation queue, reports, and audit history live-updating across multiple admin sessions.

---

## Data Flow

### Post Creation (Web)

```
User taps map → selects location → fills form
    → [optional] uploads image (edge function: upload-post-image)
    → calls edge function: create-post
        → validates, rate-limits, inserts via RPC
        → post created with status: "pending"
    → realtime notifies admin dashboard
```

### Moderation (Admin)

```
Admin sees pending post in queue
    → clicks Approve/Reject
        → direct Supabase update (status, moderation_reason)
        → moderation_events row inserted (audit log)
        → realtime updates all connected admin clients
    → approved posts become visible on public map
```

### Image Serving

```
Client requests post image
    → fetchSignedPostImageUrl(postId) [cached 5 min in-memory]
        → calls edge function: signed-post-image
        → returns signed Storage URL (valid 10 min)
    → browser loads image from signed URL
```

---

## Security

- **RLS (Row Level Security):** All tables have Postgres RLS policies. Public users can only read approved/flagged posts. Writes go through edge functions with JWT + rate limiting.
- **Admin guard:** Server-side `requireAdmin()` on every protected route. Checks `admin_users` table.
- **Rate limiting:** Edge functions enforce per-user and per-IP limits.
- **Input validation:** All user input validated and length-capped server-side.
- **Storage isolation:** Users can only access their own upload folder.
- **IP hashing:** IP addresses are hashed (not stored raw) for rate-limit keys.

---

## Caching Strategy

| What | Where | TTL |
|------|-------|-----|
| Signed image URLs (admin) | In-memory Map | 5 min |
| Signed image URLs (web) | In-memory Map | 5 min |
| Anonymous auth session | Module-level variable | Page lifetime |
| Posts API response | HTTP `Cache-Control` | 60s |

---

## Migrations (10 total)

1. Initial schema (posts, reports, moderation_events, music_cache)
2. RLS policies
3. Storage bucket + policies
4. Indexes and helper functions
5. Security hardening
6. Admin app RLS
7. Admin realtime + archiving
8. Post status lifecycle cleanup
9. Public report inserts
10. Storage public image access
