"use client";

import { ensureAnonymousSession } from "@/lib/auth/anonymous-session";
import { createClient } from "@/lib/supabase/browser";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadPrivatePostImage(file: File, postId: string) {
  if (!ALLOWED.has(file.type) || file.size > MAX_BYTES) {
    throw new Error("Use a JPEG, PNG, or WebP image up to 5 MB.");
  }
  const supabase = createClient();
  const session = await ensureAnonymousSession();
  if (!supabase || !session) return null;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "webp";
  const path = `${session.user.id}/${postId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from("post-images")
    .upload(path, file, { upsert: false, contentType: file.type });
  if (error) throw error;
  return path;
}
