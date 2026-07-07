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
        next[m.id] = m;
        changed = true;
      }
      return changed ? { markers: next } : state;
    }),
}));
