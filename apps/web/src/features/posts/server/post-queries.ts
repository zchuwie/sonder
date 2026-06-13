import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
    const admin = createAdminClient();
    const result = await admin?.storage
      .from("post-images")
      .createSignedUrl(row.image_path, 3600);
    imageUrl = result?.data?.signedUrl;
  }
  return rowToPost(row, imageUrl);
}
