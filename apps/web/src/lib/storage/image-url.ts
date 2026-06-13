export function getSignedPostImageFunctionUrl(postId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url
    ? `${url}/functions/v1/signed-post-image?postId=${encodeURIComponent(postId)}`
    : null;
}
