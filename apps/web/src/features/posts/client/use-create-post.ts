"use client";

import { createClient } from "@/lib/supabase/browser";
import { ensureAnonymousSession } from "@/lib/auth/anonymous-session";
import { uploadPrivatePostImage } from "@/lib/storage/image-upload";
import type { MarkerData, PostDraft } from "@/features/posts/lib/post-types";

export async function createSupabasePost(marker: MarkerData, draft: PostDraft) {
  const supabase = createClient();
  const session = await ensureAnonymousSession();
  if (!supabase || !session) return null;
  const uploadId = crypto.randomUUID();
  const imagePath = draft.imageFile
    ? await uploadPrivatePostImage(draft.imageFile, uploadId)
    : null;
  const { data, error } = await supabase.functions.invoke("create-post", {
    body: {
      title: draft.title,
      body: draft.text,
      lat: marker.lat,
      lng: marker.lng,
      placeName: marker.placeName,
      imagePath,
      music: draft.music,
    },
  });
  if (error) throw error;
  return data as { postId: string; status: "pending" };
}
