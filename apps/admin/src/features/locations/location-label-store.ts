"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PostRow } from "@/features/moderation/types";

type LocationLabelState = {
  labels: Record<string, string>;
  rememberPosts: (posts: PostRow[]) => void;
};

function coordinateLabel(post: PostRow) {
  return `${post.lat.toFixed(4)}, ${post.lng.toFixed(4)}`;
}

export const useLocationLabelStore = create<LocationLabelState>()(
  persist(
    (set) => ({
      labels: {},
      rememberPosts: (posts) =>
        set((state) => {
          const labels = { ...state.labels };
          let changed = false;
          for (const post of posts) {
            const coordinates = coordinateLabel(post);
            if (labels[post.id] !== coordinates) {
              labels[post.id] = coordinates;
              changed = true;
            }
          }
          return changed ? { labels } : state;
        }),
    }),
    {
      name: "sonder-admin-location-labels",
      partialize: (state) => ({ labels: state.labels }),
    },
  ),
);
