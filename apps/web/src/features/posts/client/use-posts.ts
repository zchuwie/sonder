"use client";

import { useCallback, useRef, useState } from "react";
import { ensureAnonymousSession } from "@/lib/auth/anonymous-session";
import { createClient } from "@/lib/supabase/browser";
import { rowsToMarkersWithSignedImages } from "@/features/posts/lib/post-mappers";
import type { MarkerData } from "@/features/posts/lib/post-types";
import type { PostRow } from "@/features/posts/lib/post-mappers";

export type Bounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

// ponytail: debounce timer lives in hook, not a util. Ceiling: one active fetch at a time; upgrade to AbortController queue if needed.
const DEBOUNCE_MS = 300;

export function usePosts() {
  const [remoteMarkers, setRemoteMarkers] = useState<MarkerData[] | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastBoundsRef = useRef<Bounds | null>(null);

  const fetchInBounds = useCallback(async (bounds: Bounds) => {
    const supabase = createClient();
    if (!supabase) return null;
    try {
      await ensureAnonymousSession();
      const { data, error } = await supabase.rpc("get_posts_in_bounds", {
        min_lat: bounds.south,
        min_lng: bounds.west,
        max_lat: bounds.north,
        max_lng: bounds.east,
        lim: 200,
      });
      if (error) throw error;
      const markers = await rowsToMarkersWithSignedImages(
        (data ?? []) as PostRow[],
      );
      setRemoteMarkers(markers);
      return markers;
    } catch {
      return null;
    }
  }, []);

  const refresh = useCallback(
    async (bounds?: Bounds) => {
      const b = bounds ?? lastBoundsRef.current;
      if (!b) return null;
      lastBoundsRef.current = b;
      return fetchInBounds(b);
    },
    [fetchInBounds],
  );

  const debouncedRefresh = useCallback(
    (bounds: Bounds) => {
      lastBoundsRef.current = bounds;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void fetchInBounds(bounds);
      }, DEBOUNCE_MS);
    },
    [fetchInBounds],
  );

  return { remoteMarkers, refresh, debouncedRefresh };
}
