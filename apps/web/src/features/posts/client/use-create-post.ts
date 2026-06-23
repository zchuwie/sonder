"use client";

import { createClient } from "@/lib/supabase/browser";
import { ensureAnonymousSession } from "@/lib/auth/anonymous-session";
import type { MarkerData, PostDraft } from "@/features/posts/lib/post-types";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

export async function createSupabasePost(marker: MarkerData, draft: PostDraft) {
  const supabase = createClient();
  const session = await ensureAnonymousSession();
  if (!supabase || !session) return null;

  // Upload image at submit time (not before)
  let imagePath: string | null = null;
  if (draft.imageFile) {
    const mimeType = draft.imageFile.type || "image/jpeg";
    if (!ALLOWED.has(mimeType) || draft.imageFile.size > MAX_BYTES) {
      throw new Error("Use a JPEG, PNG, or WebP image up to 5 MB.");
    }
    const ext = mimeType.split("/")[1] ?? "jpg";
    const path = `${session.user.id}/${crypto.randomUUID?.() ?? Date.now().toString(36)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(path, draft.imageFile, { contentType: mimeType });
    if (uploadError) throw new Error("Image upload failed. Try again.");
    imagePath = path;
  }

  const { data, error } = await supabase.functions.invoke("create-post", {
    body: {
      title: draft.title,
      body: draft.text,
      lat: marker.lat,
      lng: marker.lng,
      placeName: marker.placeName,
      imagePath,
      music: draft.music,
      turnstileToken: draft.turnstileToken,
    },
  });
  if (error) {
    // Clean up uploaded image if post creation fails
    if (imagePath) await supabase.storage.from("post-images").remove([imagePath]);
    throw error;
  }
  return data as { postId: string; status: "pending" };
}
