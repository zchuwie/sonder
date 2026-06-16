import "server-only";

import { createClient } from "@/lib/supabase/server";
import { rowToPost } from "@/features/posts/lib/post-mappers";
import type { PostRow } from "@/features/posts/lib/post-mappers";

export async function getVisiblePost(postId: string) {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .eq("status", "visible")
    .maybeSingle();
  if (!data) return null;
  const row = data as PostRow;
  let imageUrl: string | undefined;
  if (row.image_path) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      const response = await fetch(
        `${url}/functions/v1/signed-post-image?postId=${encodeURIComponent(row.id)}`,
        { headers: { apikey: key }, next: { revalidate: 300 } },
      );
      const signed = (await response.json().catch(() => null)) as {
        signedUrl?: string;
      } | null;
      imageUrl = response.ok ? signed?.signedUrl : undefined;
    }
  }
  return rowToPost(row, imageUrl);
}
