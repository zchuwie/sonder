<p align="center">
  <img src="apps/web/public/brand/sonder-logo.png" width="80" alt="Sonder logo" />
</p>

<h1 align="center">Sonder</h1>

<p align="center">
  An anonymous place-based wall for thoughts, photos, and songs. 📍
</p>

<p align="center">
  <a href="https://sonderconfessions.vercel.app">Live</a> ·
  <a href="#overview">Overview</a> ·
  <a href="#tech-stack">Stack</a> ·
  <a href="#getting-started">Getting Started</a>
</p>

---

## Overview

Sonder lets people leave anonymous posts pinned to real-world locations — a confession at a park bench, a memory at a street corner, a song that reminds you of somewhere. No accounts, no profiles. Just thoughts left behind for strangers to find.

- 🗺️ Interactive map with location-based posts
- 🎵 Attach songs from Deezer
- 📷 Photo attachments with private storage
- 🛡️ Full moderation pipeline (pending → approved → archived)
- 🤖 Bot protection via Cloudflare Turnstile
- ⚡ Real-time updates

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, React 19 |
| Styling | Tailwind CSS 4 |
| Maps | MapLibre GL, OpenFreeMap, Nominatim |
| Backend | Supabase (Postgres, Auth, Storage, Edge Functions, Realtime) |
| Rate Limiting | Upstash Redis |
| Bot Protection | Cloudflare Turnstile |
| Hosting | Vercel |

## Monorepo Structure

| Path | Description |
|------|-------------|
| `apps/web` | Public-facing map app |
| `apps/admin` | Moderation dashboard |
| `packages/map-config` | Shared map configuration |
| `supabase/migrations` | Database schema & RLS policies |
| `supabase/functions` | Edge Functions (create-post, report-post, etc.) |

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm 9+
- Supabase CLI

### Install & Run

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
pnpm dev --filter web
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
NEXT_PUBLIC_SITE_URL=
NOMINATIM_CONTACT_EMAIL=
```

### Database

```bash
pnpm supa:start        # start local Supabase
pnpm supa:db:reset     # reset & run all migrations
pnpm supa:types        # generate TypeScript types
```

## License

All rights reserved.
