"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/browser";
import type { MusicSearchResult } from "@/features/music/lib/music-types";
import {
  getMusicSearchKey,
  useMusicSearchStore,
} from "@/features/music/store/use-music-search-store";

const pendingSearches = new Map<string, Promise<MusicSearchResult[]>>();

async function requestMusic(query: string): Promise<MusicSearchResult[]> {
  const params = new URLSearchParams(
    query ? { q: query } : { mode: "suggestions" },
  );
  const response = await fetch(`/api/music/search?${params}`);
  if (response.status === 429) throw Object.assign(new Error("rate_limited"), { rateLimited: true });
  if (!response.ok) {
    // Fallback to edge function on non-429 errors
    const supabase = createClient();
    if (!supabase) throw new Error("Music search unavailable");
    const { data, error } = await supabase.functions.invoke("deezer-search", {
      body: query ? { query } : { mode: "suggestions" },
    });
    if (error) throw error;
    return (data?.results ?? []) as MusicSearchResult[];
  }
  const payload = (await response.json()) as { results?: MusicSearchResult[] };
  return payload.results ?? [];
}

export function useDeezerSearch(query: string) {
  const trimmed = query.trim();
  const key = getMusicSearchKey(trimmed);
  const entry = useMusicSearchStore((state) => state.cache[key]);

  useEffect(() => {
    if (trimmed.length === 1) {
      return;
    }

    const store = useMusicSearchStore.getState();
    if (store.getFreshEntry(key)) return;

    const timer = setTimeout(() => {
      const current = useMusicSearchStore.getState();
      if (current.getFreshEntry(key)) return;
      current.beginSearch(key);

      const pending =
        pendingSearches.get(key) ??
        requestMusic(trimmed).finally(() => pendingSearches.delete(key));
      pendingSearches.set(key, pending);
      void pending
        .then((results) =>
          useMusicSearchStore.getState().completeSearch(key, results),
        )
        .catch((err: unknown) => {
          const limited = typeof err === "object" && err !== null && "rateLimited" in err;
          useMusicSearchStore.getState().failSearch(key, !!limited);
        });
    }, trimmed ? 300 : 0);

    return () => clearTimeout(timer);
  }, [key, trimmed]);

  return {
    results: trimmed.length === 1 ? [] : (entry?.results ?? []),
    loading: trimmed.length === 1 ? false : (entry?.loading ?? true),
    error: trimmed.length === 1 ? false : (entry?.error ?? false),
    rateLimited: trimmed.length === 1 ? false : (entry?.rateLimited ?? false),
  };
}
