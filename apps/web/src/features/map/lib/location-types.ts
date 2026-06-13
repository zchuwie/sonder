export type LocationPlaceDTO = {
  id: string;
  name: string;
  category: string;
  address: string;
  description: string;
  tags: string[];
  lat: number;
  lng: number;
  provider?: "photon" | "nominatim" | "local";
  bbox?: [number, number, number, number];
};
