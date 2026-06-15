import { handleOptions } from "../_shared/cors.ts";
import { appError, json } from "../_shared/responses.ts";
import { createAdminClient } from "../_shared/supabase.ts";
import { AppError } from "../_shared/app-error.ts";

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  try {
    const secret = Deno.env.get("CLEANUP_SECRET");
    if (!secret || req.headers.get("x-cleanup-secret") !== secret) {
      throw new AppError("forbidden", "Cleanup access denied.", 403);
    }
    const admin = createAdminClient();
    const { data: uploads, error: selectError } = await admin
      .from("post_uploads")
      .select("id,bucket,path")
      .eq("status", "temporary")
      .lt("expires_at", new Date().toISOString())
      .limit(100);
    if (selectError) throw selectError;

    let deleted = 0;
    for (const upload of uploads ?? []) {
      const { error: removeError } = await admin.storage
        .from(upload.bucket)
        .remove([upload.path]);
      if (removeError) continue;
      const { error: updateError } = await admin
        .from("post_uploads")
        .update({ status: "expired" })
        .eq("id", upload.id)
        .eq("status", "temporary");
      if (!updateError) deleted++;
    }
    return json({ inspected: uploads?.length ?? 0, deleted });
  } catch (cause) {
    return appError(cause, "Unable to clean expired uploads.");
  }
});
