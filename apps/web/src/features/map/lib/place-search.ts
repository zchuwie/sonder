import { localPlaceAliases } from "./local-place-aliases";
import { normalizeSearchText, rankSearchResults } from "./search-fuzzy";
import { searchNominatim, RateLimitedError } from "./search-providers/nominatim";
import { searchPhoton } from "./search-providers/photon";
import type { PlaceSearchResult, SearchCenter } from "./place-search-types";

const CACHE_TTL_MS = 5 * 60 * 1000;
const searchCache = new Map<
  string,
  { timestamp: number; results: PlaceSearchResult[] }
>();

function cacheKey(query: string, center?: SearchCenter): string {
  const location = center
    ? `${center.lat.toFixed(2)},${center.lng.toFixed(2)}`
    : "global";
  return `${normalizeSearchText(query)}:${location}`;
}

export function searchLocalPlaces(
  query: string,
  center?: SearchCenter,
): PlaceSearchResult[] {
  return rankSearchResults(localPlaceAliases, query, center);
}

export async function searchPlaces(
  query: string,
  center?: SearchCenter,
  signal?: AbortSignal,
): Promise<PlaceSearchResult[]> {
  const key = cacheKey(query, center);
  const cached = searchCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.results;
  }

  const local = searchLocalPlaces(query, center);
  const photon = await searchPhoton(query, center, signal).catch(() => []);
  const nominatim =
    photon.length < 3
      ? await searchNominatim(query, center, signal).catch((err) => {
          if (err instanceof RateLimitedError) throw err; // propagate 429
          return [];
        })
      : [];
  const results = rankSearchResults([...local, ...photon, ...nominatim], query, center);
  searchCache.set(key, { timestamp: Date.now(), results });
  return results;
}
