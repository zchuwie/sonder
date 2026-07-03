import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import type { PlaceSearchResult } from "@/features/map/lib/place-search-types";

type NominatimResult = {
  place_id: number;
  osm_id?: number;
  display_name: string;
  name?: string;
  lat: string;
  lon: string;
  type?: string;
  class?: string;
  importance?: number;
  boundingbox?: [string, string, string, string];
};

export const revalidate = 300;

export async function GET(request: NextRequest) {
  const limited = await checkRateLimit(request, "places-search", 20, 60);
  if (limited) return limited;

  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query || query.length < 2) return NextResponse.json([]);

  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: "5",
    addressdetails: "1",
    "accept-language": "en",
  });
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    {
      headers: {
        "User-Agent": `Sonder place search (${process.env.NOMINATIM_CONTACT_EMAIL ?? "contact-not-configured"})`,
      },
      next: { revalidate: 300 },
    },
  );
  if (!response.ok) return NextResponse.json([], { status: 502 });
  const data = (await response.json()) as NominatimResult[];
  const results: PlaceSearchResult[] = data.map((item) => {
    const parts = item.display_name.split(",").map((part) => part.trim());
    const bbox = item.boundingbox?.map(Number);
    return {
      id: `nominatim-${item.osm_id ?? item.place_id}`,
      provider: "nominatim",
      name: item.name ?? parts[0] ?? "Unknown place",
      label: parts.slice(1, 5).join(", "),
      category: item.type ?? item.class ?? "Place",
      type: item.class,
      lat: Number(item.lat),
      lng: Number(item.lon),
      bbox:
        bbox?.length === 4
          ? [bbox[2]!, bbox[0]!, bbox[3]!, bbox[1]!]
          : undefined,
      importance: item.importance,
    };
  });
  return NextResponse.json(results);
}
