"use client";

import { ensureAnonymousSession } from "@/lib/auth/anonymous-session";
import { createClient } from "@/lib/supabase/browser";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function uploadPrivatePostImage(file: File) {
  if (!ALLOWED.has(file.type) || file.size > MAX_BYTES) {
    throw new Error("Use a JPEG, PNG, or WebP image up to 5 MB.");
  }
  const supabase = createClient();
  const session = await ensureAnonymousSession();
  if (!supabase || !session)
    throw new Error("Unable to start anonymous session.");
  const form = new FormData();
  form.set("file", file);
  const { data, error } = await supabase.functions.invoke("upload-post-image", {
    body: form,
  });
  if (error) throw error;
  return (data as { uploadId: string }).uploadId;
}
