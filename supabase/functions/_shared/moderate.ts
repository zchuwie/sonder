import { requireAdmin } from "./admin.ts";
import { createAdminClient } from "./supabase.ts";
import { requiredString, optionalString } from "./validation.ts";

export async function moderate(
  req: Request,
  status: "visible" | "rejected" | "hidden",
) {
  const actor = await requireAdmin(req);
  const input = await req.json();
  const postId = requiredString(input.postId, "postId", 100);
  const reason = optionalString(input.reason, "reason", 500);
  const timestamps = {
    visible: {
      approved_at: new Date().toISOString(),
      rejected_at: null,
      hidden_at: null,
    },
    rejected: { rejected_at: new Date().toISOString() },
    hidden: { hidden_at: new Date().toISOString() },
  }[status];
  const admin = createAdminClient();
  const { error } = await admin
    .from("posts")
    .update({
      status,
      moderation_reason: reason,
      ...timestamps,
    })
    .eq("id", postId);
  if (error) throw error;
  await admin.from("moderation_events").insert({
    post_id: postId,
    action: status,
    reason,
    actor_id: actor.id,
  });
  return { postId, status };
}
