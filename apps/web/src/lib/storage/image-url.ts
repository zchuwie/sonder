export function getSignedPostImageFunctionUrl(postId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url
    ? `${url}/functions/v1/signed-post-image?postId=${encodeURIComponent(postId)}`
    : null;
}

type SignedImageFetchInit = RequestInit & { next?: { revalidate?: number } };

export async function fetchSignedPostImageUrl(
  postId: string,
  init?: SignedImageFetchInit,
) {
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
    return signed?.signedUrl;
  } catch (err) {
    console.warn(`[signed-post-image] ${postId}: fetch failed`, err);
    return undefined;
  }
}
