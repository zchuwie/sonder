import { handleOptions } from "../_shared/cors.ts";
import { appError, json } from "../_shared/responses.ts";
import { createAdminClient, requireUser } from "../_shared/supabase.ts";
import {
  optionalString,
  requiredString,
  requiredUuid,
} from "../_shared/validation.ts";
import { getIpHash } from "../_shared/request-identity.ts";
import { enforceRateLimits } from "../_shared/rate-limit.ts";
import { AppError } from "../_shared/app-error.ts";

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  try {
    const user = await requireUser(req);
    const input = await req.json();
    const postId = requiredUuid(input.postId, "postId");
    const ipHash = await getIpHash(req);
    await enforceRateLimits([
      { key: `report-post:user:${user.id}`, limit: 10, windowSeconds: 600 },
      { key: `report-post:ip:${ipHash}`, limit: 30, windowSeconds: 3600 },
      {
        key: `report-post:post:${postId}:user:${user.id}`,
        limit: 2,
        windowSeconds: 86400,
      },
    ]);
    const admin = createAdminClient();
    const { data: post } = await admin
      .from("posts")
      .select("id")
      .eq("id", postId)
      .eq("status", "approved")
      .is("deleted_at", null)
      .maybeSingle();
    if (!post) throw new Error("Approved post not found");
    const { error: insertError } = await admin.from("post_reports").insert({
      post_id: postId,
      reason: requiredString(input.reason, "reason", 120),
      details: optionalString(input.details, "details", 1000),
      reported_by: user.id,
    });
    if (insertError?.code === "23505") {
      throw new AppError(
        "already_reported",
        "You have already reported this post.",
        409,
      );
    }
    if (insertError) throw insertError;
    const { error: updateError } = await admin
      .from("posts")
      .update({
        status: "flagged",
        status_updated_at: new Date().toISOString(),
        moderation_reason: "Reported by user",
      })
      .eq("id", postId)
      .eq("status", "approved")
      .is("deleted_at", null);
    if (updateError) throw updateError;
    return json({ reported: true }, 201);
  } catch (cause) {
    return appError(cause, "Unable to report post.");
  }
});
