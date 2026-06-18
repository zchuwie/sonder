"use client";

import { useCallback } from "react";
import type { PostRow } from "@/features/moderation/types";

export function useLocationLabels(posts: PostRow[]) {
  return useCallback((post: PostRow) => {
    const known = posts.find((item) => item.id === post.id);
    return `${(known ?? post).lat.toFixed(4)}, ${(known ?? post).lng.toFixed(4)}`;
  }, [posts]);
}
