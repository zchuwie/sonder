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
    const { data: post } = await admin
      .from("posts")
      .select("image_path")
      .eq("id", postId)
      .eq("status", "visible")
      .maybeSingle();
    if (!post?.image_path) throw new Error("Public image not found");
    const { data, error: signError } = await admin.storage
      .from("post-images")
      .createSignedUrl(post.image_path, 3600);
    if (signError) throw signError;
    return json({ signedUrl: data.signedUrl, expiresIn: 3600 });
  } catch (cause) {
    return error(
      cause instanceof Error ? cause.message : "Unable to sign image",
      404,
    );
  }
});
