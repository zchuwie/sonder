import { create } from "zustand";
import type { MusicSearchResult } from "@/features/music/lib/music-types";

const SEARCH_TTL_MS = 5 * 60 * 1000;
const SUGGESTIONS_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 30;

export type MusicSearchCacheEntry = {
  results: MusicSearchResult[];
  timestamp: number;
  loading: boolean;
  error: boolean;
};

type MusicSearchStore = {
  cache: Record<string, MusicSearchCacheEntry>;
  getFreshEntry: (key: string, now?: number) => MusicSearchCacheEntry | null;
  beginSearch: (key: string) => void;
  completeSearch: (key: string, results: MusicSearchResult[]) => void;
  failSearch: (key: string) => void;
  clearExpired: (now?: number) => void;
  clearCache: () => void;
};

export function getMusicSearchKey(query: string): string {
  const normalized = query.trim().toLowerCase().replace(/\s+/g, " ");
  return normalized || "__suggestions__";
}

function getTtl(key: string): number {
  return key === "__suggestions__" ? SUGGESTIONS_TTL_MS : SEARCH_TTL_MS;
}

function trimCache(
  cache: Record<string, MusicSearchCacheEntry>,
): Record<string, MusicSearchCacheEntry> {
  return Object.fromEntries(
    Object.entries(cache)
      .sort(([, a], [, b]) => b.timestamp - a.timestamp)
      .slice(0, MAX_CACHE_ENTRIES),
  );
}

export const useMusicSearchStore = create<MusicSearchStore>((set, get) => ({
  cache: {},
  getFreshEntry: (key, now = Date.now()) => {
    const entry = get().cache[key];
    return entry && now - entry.timestamp < getTtl(key) ? entry : null;
  },
  beginSearch: (key) =>
    set((state) => ({
      cache: {
        ...state.cache,
        [key]: {
          results: state.cache[key]?.results ?? [],
          timestamp: state.cache[key]?.timestamp ?? 0,
          loading: true,
          error: false,
        },
      },
    })),
  completeSearch: (key, results) =>
    set((state) => ({
      cache: trimCache({
        ...state.cache,
        [key]: {
          results,
          timestamp: Date.now(),
          loading: false,
          error: false,
        },
      }),
    })),
  failSearch: (key) =>
    set((state) => ({
      cache: {
        ...state.cache,
        [key]: {
          results: state.cache[key]?.results ?? [],
          timestamp: state.cache[key]?.timestamp ?? 0,
          loading: false,
          error: true,
        },
      },
    })),
  clearExpired: (now = Date.now()) =>
    set((state) => ({
      cache: Object.fromEntries(
        Object.entries(state.cache).filter(
          ([key, entry]) => now - entry.timestamp < getTtl(key),
        ),
      ),
    })),
  clearCache: () => set({ cache: {} }),
}));
