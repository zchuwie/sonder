"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import type { MusicSearchResult } from "@/features/music/lib/music-types";

export function useDeezerSearch(query: string) {
  const [results, setResults] = useState<MusicSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length === 1) {
      setResults([]);
      setLoading(false);
      setError(false);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(false);
      try {
        const params = new URLSearchParams(
          trimmed ? { q: trimmed } : { mode: "suggestions" },
        );
        const response = await fetch(`/api/music/search?${params}`);
        if (!response.ok) throw new Error("Website music search unavailable");
        const payload = (await response.json()) as {
          results?: MusicSearchResult[];
        };
        setResults(payload.results ?? []);
      } catch {
        const supabase = createClient();
        if (!supabase) {
          setResults([]);
          setError(true);
          return;
        }
        try {
        const { data, error: requestError } = await supabase.functions.invoke(
          "deezer-search",
          {
            body: trimmed ? { query: trimmed } : { mode: "suggestions" },
          },
        );
        if (requestError) throw requestError;
        setResults((data?.results ?? []) as MusicSearchResult[]);
        } catch {
          setResults([]);
          setError(true);
        }
      } finally {
        setLoading(false);
      }
    }, trimmed ? 300 : 0);
    return () => clearTimeout(timer);
  }, [query]);

  return { results, loading, error };
}
