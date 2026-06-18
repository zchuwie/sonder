import { handleOptions } from "../_shared/cors.ts";
import { error, json } from "../_shared/responses.ts";
import { createAdminClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  try {
    const postId = new URL(req.url).searchParams.get("postId");
    if (!postId) throw new Error("postId is required");
    const admin = createAdminClient();
    // Query without status filter first to debug — then check status in code
    const { data: post, error: queryError } = await admin
      .from("posts")
      .select("image_path, status, deleted_at")
      .eq("id", postId)
      .maybeSingle();
    if (queryError) {
      console.error("signed-post-image query error:", queryError.message);
      throw new Error("Database query failed");
    }
    if (!post) throw new Error("Post not found");
    if (!post.image_path) throw new Error("Post has no image");
    if (!["approved", "flagged"].includes(post.status)) {
      throw new Error(`Post status is '${post.status}', not approved/flagged`);
    }
    if (post.deleted_at) throw new Error("Post is deleted");
    const { data, error: signError } = await admin.storage
      .from("post-images")
      .createSignedUrl(post.image_path, 3600);
    if (signError) {
      console.error("signed-post-image sign error:", signError.message);
      throw new Error("Unable to sign image URL");
    }
    return json({ signedUrl: data.signedUrl, expiresIn: 3600 });
  } catch (cause) {
    const msg = cause instanceof Error ? cause.message : "Unable to sign image";
    console.error("signed-post-image failed:", msg);
    return error(msg, 404);
  }
});
