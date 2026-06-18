"use client";

import { useCallback, useEffect, useState } from "react";
import { ensureAnonymousSession } from "@/lib/auth/anonymous-session";
import { createClient } from "@/lib/supabase/browser";
import { rowsToMarkersWithSignedImages } from "@/features/posts/lib/post-mappers";
import type { MarkerData } from "@/features/posts/lib/post-types";
import type { PostRow } from "@/features/posts/lib/post-mappers";

export function usePosts() {
  const [remoteMarkers, setRemoteMarkers] = useState<MarkerData[] | null>(null);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    if (!supabase) return null;
    try {
      await ensureAnonymousSession();
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .in("status", ["approved", "flagged"])
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
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

  useEffect(() => {
    void refresh();
  }, [refresh]);
  return { remoteMarkers, refresh };
}
