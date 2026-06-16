"use client";

import { createClient } from "@/lib/supabase/browser";
import { ensureAnonymousSession } from "@/lib/auth/anonymous-session";

export async function reportRemotePost(
  postId: string,
  reason = "community_report",
  details?: string,
) {
  const supabase = createClient();
  if (!supabase) return false;
  await ensureAnonymousSession();
  const { error } = await supabase.functions.invoke("report-post", {
    body: { postId, reason, details },
  });
  if (error) throw error;
  return true;
}
