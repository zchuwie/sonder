export type SearchCenter = { lat: number; lng: number };

export type PlaceSearchResult = {
  id: string;
  provider: "photon" | "nominatim" | "local";
  name: string;
  label: string;
  category?: string;
  type?: string;
  lat: number;
  lng: number;
  bbox?: [number, number, number, number];
  importance?: number;
  aliases?: string[];
  sourceRaw?: unknown;
};
