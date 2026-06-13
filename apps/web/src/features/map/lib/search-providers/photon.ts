import type {
  PlaceSearchResult,
  SearchCenter,
} from "../place-search-types";

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: Record<string, string | number | undefined>;
};

export async function searchPhoton(
  query: string,
  center?: SearchCenter,
  signal?: AbortSignal,
): Promise<PlaceSearchResult[]> {
  const params = new URLSearchParams({ q: query, limit: "8", lang: "en" });
  if (center) {
    params.set("lat", String(center.lat));
    params.set("lon", String(center.lng));
  }
  const response = await fetch(`https://photon.komoot.io/api/?${params}`, {
    signal,
  });
  if (!response.ok) return [];
  const data = (await response.json()) as { features?: PhotonFeature[] };

  return (data.features ?? []).flatMap((feature, index) => {
    const coordinates = feature.geometry?.coordinates;
    const properties = feature.properties ?? {};
    if (!coordinates) return [];
    const name = String(
      properties.name ??
        properties.street ??
        properties.city ??
        properties.district ??
        "Unknown place",
    );
    const context = [
      properties.district,
      properties.city,
      properties.state,
      properties.country,
    ]
      .filter((part) => part && part !== name)
      .join(", ");
    return [{
      id: `photon-${properties.osm_type ?? "place"}-${properties.osm_id ?? index}`,
      provider: "photon" as const,
      name,
      label: context,
      category: String(properties.type ?? properties.osm_value ?? "Place"),
      type: String(properties.osm_key ?? ""),
      lat: coordinates[1],
      lng: coordinates[0],
      importance: Number(properties.importance ?? 0),
      sourceRaw: feature,
    }];
  });
}
