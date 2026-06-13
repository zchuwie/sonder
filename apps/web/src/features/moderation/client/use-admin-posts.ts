"use client";

import { createClient } from "@/lib/supabase/browser";

export async function moderateRemotePost(
  postId: string,
  decision: "approve" | "reject" | "hide",
  reason?: string,
) {
  const supabase = createClient();
  if (!supabase) return false;
  const functionName = {
    approve: "admin-approve-post",
    reject: "admin-reject-post",
    hide: "admin-hide-post",
  }[decision];
  const { error } = await supabase.functions.invoke(functionName, {
    body: { postId, reason },
  });
  if (error) throw error;
  return true;
}
