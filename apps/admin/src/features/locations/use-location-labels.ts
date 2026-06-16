"use client";

import { useEffect } from "react";
import type { PostRow } from "@/features/moderation/types";
import { useLocationLabelStore } from "./location-label-store";

export function useLocationLabels(posts: PostRow[]) {
  const labels = useLocationLabelStore((state) => state.labels);
  const rememberPosts = useLocationLabelStore((state) => state.rememberPosts);

  useEffect(() => {
    rememberPosts(posts);
  }, [posts, rememberPosts]);

  return (post: PostRow) =>
    labels[post.id] || `${post.lat.toFixed(4)}, ${post.lng.toFixed(4)}`;
}
