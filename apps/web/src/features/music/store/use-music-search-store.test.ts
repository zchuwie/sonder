import {
  getMusicSearchKey,
  useMusicSearchStore,
} from "./use-music-search-store";
import type { MusicSearchResult } from "@/features/music/lib/music-types";

const song: MusicSearchResult = {
  provider: "deezer",
  providerId: "1",
  title: "Tahanan",
  artist: "Adie",
};

describe("music search store", () => {
  beforeEach(() => useMusicSearchStore.getState().clearCache());

  it("normalizes query keys and caches fresh results", () => {
    const key = getMusicSearchKey("  TaHaNan  ");
    useMusicSearchStore.getState().completeSearch(key, [song]);

    expect(key).toBe("tahanan");
    expect(useMusicSearchStore.getState().getFreshEntry(key)?.results).toEqual([
      song,
    ]);
  });

  it("expires stale search results", () => {
    const key = getMusicSearchKey("tahanan");
    useMusicSearchStore.getState().completeSearch(key, [song]);
    const timestamp = useMusicSearchStore.getState().cache[key]!.timestamp;

    expect(
      useMusicSearchStore
        .getState()
        .getFreshEntry(key, timestamp + 5 * 60 * 1000),
    ).toBeNull();
  });

  it("limits cache growth", () => {
    for (let index = 0; index < 35; index++) {
      useMusicSearchStore
        .getState()
        .completeSearch(`query-${index}`, [{ ...song, providerId: `${index}` }]);
    }

    expect(Object.keys(useMusicSearchStore.getState().cache)).toHaveLength(30);
  });
});
