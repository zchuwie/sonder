import "server-only";

import { createClient } from "@/lib/supabase/server";
import { fetchSignedPostImageUrl } from "@/lib/storage/image-url";
import { rowToPost } from "@/features/posts/lib/post-mappers";
import type { PostRow } from "@/features/posts/lib/post-mappers";

export async function getVisiblePost(postId: string) {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("posts")
    .select("*")
    .eq("id", postId)
    .in("status", ["approved", "flagged"])
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) return null;
  const row = data as PostRow;
  const imageUrl = row.image_path
    ? await fetchSignedPostImageUrl(row.id, { next: { revalidate: 300 } })
    : undefined;
  return rowToPost(row, imageUrl);
}
