// ponytail: LRU-capped cache + batch resolution for signed image URLs.
// Ceiling: 200-entry in-memory cache, one Supabase Edge Function call per batch.
// Upgrade path: use a Service Worker cache or KV store for cross-tab sharing.

const MAX_CACHE_SIZE = 200;
const SIGNED_URL_CACHE_TTL = 50 * 60_000; // 50 min (URLs valid 1h)

const signedUrlCache = new Map<string, { url: string; expires: number }>();

function cacheGet(postId: string): string | undefined {
  const entry = signedUrlCache.get(postId);
  if (!entry) return undefined;
  if (Date.now() > entry.expires) {
    signedUrlCache.delete(postId);
    return undefined;
  }
  // LRU: move to end (most recently used)
  signedUrlCache.delete(postId);
  signedUrlCache.set(postId, entry);
  return entry.url;
}

function cacheSet(postId: string, url: string) {
  // Evict oldest if at capacity
  if (signedUrlCache.size >= MAX_CACHE_SIZE) {
    const oldest = signedUrlCache.keys().next().value;
    if (oldest) signedUrlCache.delete(oldest);
  }
  signedUrlCache.set(postId, { url, expires: Date.now() + SIGNED_URL_CACHE_TTL });
}

export function getSignedPostImageFunctionUrl(postId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url
    ? `${url}/functions/v1/signed-post-image?postId=${encodeURIComponent(postId)}`
    : null;
}

/**
 * Fetch a single signed image URL (with cache).
 * Prefer `fetchSignedPostImageUrls` for batching multiple posts.
 */
export async function fetchSignedPostImageUrl(
  postId: string,
  init?: RequestInit & { next?: { revalidate?: number } },
): Promise<string | undefined> {
  const cached = cacheGet(postId);
  if (cached) return cached;

  const url = getSignedPostImageFunctionUrl(postId);
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return undefined;

  try {
    const response = await fetch(url, {
      ...init,
      headers: { ...init?.headers, apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!response.ok) return undefined;
    const signed = (await response.json()) as { signedUrl?: string } | null;
    if (signed?.signedUrl) cacheSet(postId, signed.signedUrl);
    return signed?.signedUrl;
  } catch {
    return undefined;
  }
}

/**
 * Batch-fetch signed image URLs for multiple posts.
 * Only calls the Edge Function for uncached post IDs.
 * Returns a Map<postId, signedUrl>.
 */
export async function fetchSignedPostImageUrls(
  postIds: string[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const uncached: string[] = [];

  for (const id of postIds) {
    const cached = cacheGet(id);
    if (cached) {
      result.set(id, cached);
    } else {
      uncached.push(id);
    }
  }

  if (uncached.length === 0) return result;

  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!key || !baseUrl) return result;

  // Fetch uncached in parallel but capped at 6 concurrent (avoid overwhelming edge)
  const CONCURRENCY = 6;
  for (let i = 0; i < uncached.length; i += CONCURRENCY) {
    const batch = uncached.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(async (postId) => {
        const url = `${baseUrl}/functions/v1/signed-post-image?postId=${encodeURIComponent(postId)}`;
        const res = await fetch(url, {
          headers: { apikey: key, Authorization: `Bearer ${key}` },
        });
        if (!res.ok) return { postId, signedUrl: undefined };
        const data = (await res.json()) as { signedUrl?: string } | null;
        return { postId, signedUrl: data?.signedUrl };
      }),
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value.signedUrl) {
        cacheSet(r.value.postId, r.value.signedUrl);
        result.set(r.value.postId, r.value.signedUrl);
      }
    }
  }

  return result;
}
