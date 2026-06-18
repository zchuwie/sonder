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
  const response = await fetch("/api/report-post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ postId, reason, details }),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;
    throw new Error(payload?.message ?? "Unable to report post.");
  }
  return true;
}
