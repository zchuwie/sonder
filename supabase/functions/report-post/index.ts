import { handleOptions } from "../_shared/cors.ts";
import { error, json } from "../_shared/responses.ts";
import { createAdminClient, requireUser } from "../_shared/supabase.ts";
import { optionalString, requiredString } from "../_shared/validation.ts";

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  try {
    const user = await requireUser(req);
    const input = await req.json();
    const postId = requiredString(input.postId, "postId", 100);
    const admin = createAdminClient();
    const { data: post } = await admin
      .from("posts")
      .select("id")
      .eq("id", postId)
      .eq("status", "visible")
      .maybeSingle();
    if (!post) throw new Error("Visible post not found");
    const { error: insertError } = await admin.from("post_reports").insert({
      post_id: postId,
      reason: requiredString(input.reason, "reason", 120),
      details: optionalString(input.details, "details", 1000),
      reported_by: user.id,
    });
    if (insertError) throw insertError;
    return json({ reported: true }, 201);
  } catch (cause) {
    return error(
      cause instanceof Error ? cause.message : "Unable to report post",
      400,
    );
  }
});
