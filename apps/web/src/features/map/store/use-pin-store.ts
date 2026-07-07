import { create } from "zustand";
import type { MarkerData } from "@/features/posts/lib/post-types";

export const usePinStore = create<{
  markers: Record<string, MarkerData>;
  addMarkers: (markers: MarkerData[]) => void;
}>((set) => ({
  markers: {},
  addMarkers: (newMarkers) =>
    set((state) => {
      const next = { ...state.markers };
      let changed = false;
      for (const m of newMarkers) {
        const existing = next[m.id];
        if (!existing) {
          next[m.id] = m;
          changed = true;
          continue;
        }
        const postsById = new Map(existing.posts.map((p) => [p.id, p]));
        for (const post of m.posts) postsById.set(post.id, post);
        const mergedPosts = [...postsById.values()];
        if (mergedPosts.length !== existing.posts.length) {
          next[m.id] = { ...m, posts: mergedPosts };
          changed = true;
        }
      }
      return changed ? { markers: next } : state;
    }),
}));
