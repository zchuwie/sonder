import type { PlaceSearchResult, SearchCenter } from "../place-search-types";

export async function searchNominatim(
  query: string,
  center?: SearchCenter,
  signal?: AbortSignal,
): Promise<PlaceSearchResult[]> {
  const params = new URLSearchParams({ q: query });
  if (center) {
    params.set("lat", String(center.lat));
    params.set("lng", String(center.lng));
  }
  const response = await fetch(`/api/places/search?${params}`, { signal });
  if (!response.ok) return [];
  return (await response.json()) as PlaceSearchResult[];
}
