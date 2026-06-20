export function getSignedPostImageFunctionUrl(postId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url
    ? `${url}/functions/v1/signed-post-image?postId=${encodeURIComponent(postId)}`
    : null;
}

type SignedImageFetchInit = RequestInit & { next?: { revalidate?: number } };

// ponytail: in-memory cache for signed image URLs. TTL 5 min. Ceiling: unbounded map if thousands of posts; upgrade to LRU if needed.
const signedUrlCache = new Map<string, { url: string; expires: number }>();
const SIGNED_URL_CACHE_TTL = 5 * 60_000;

export async function fetchSignedPostImageUrl(
  postId: string,
  init?: SignedImageFetchInit,
) {
  const cached = signedUrlCache.get(postId);
  if (cached && cached.expires > Date.now()) return cached.url;

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
    if (!response.ok) {
      console.warn(`[signed-post-image] ${postId}: ${response.status}`, await response.text().catch(() => ""));
      return undefined;
    }
    const signed = (await response.json()) as { signedUrl?: string } | null;
    const signedUrl = signed?.signedUrl;
    if (signedUrl) signedUrlCache.set(postId, { url: signedUrl, expires: Date.now() + SIGNED_URL_CACHE_TTL });
    return signedUrl;
  } catch (err) {
    console.warn(`[signed-post-image] ${postId}: fetch failed`, err);
    return undefined;
  }
}
