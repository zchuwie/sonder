"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import maplibregl from "maplibre-gl";
import { getOpenFreeMapStyle } from "@repo/map-config";
import { useTheme } from "next-themes";
import { reverseGeocode } from "@/features/map/client/reverse-geocode";

type Location = { lat: number; lng: number; placeName?: string };

export function CreateMapPicker({ onLocationConfirm }: { onLocationConfirm: (loc: Location) => void }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const { resolvedTheme } = useTheme();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ name: string; lat: number; lng: number }[]>([]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    const m = new maplibregl.Map({
      container: mapContainer.current,
      style: getOpenFreeMapStyle(resolvedTheme),
      center: [120.9842, 14.5995],
      zoom: 12,
      attributionControl: false,
    });
    m.on("click", async (e) => {
      const { lng, lat } = e.lngLat;
      placePin(lat, lng);
      const placeName = await reverseGeocode(lat, lng);
      onLocationConfirm({ lat, lng, placeName });
    });
    map.current = m;
    return () => { m.remove(); map.current = null; };
  }, []);

  function placePin(lat: number, lng: number) {
    if (!map.current) return;
    if (marker.current) {
      marker.current.setLngLat([lng, lat]);
    } else {
      marker.current = new maplibregl.Marker({ color: "#245236" })
        .setLngLat([lng, lat])
        .addTo(map.current);
    }
    map.current.flyTo({ center: [lng, lat], zoom: Math.max(map.current.getZoom(), 14) });
  }

  async function search(q: string) {
    if (q.length < 2) { setResults([]); return; }
    try {
      const res = await fetch(`/api/places/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) return;
      const data = (await res.json()) as { results: { name: string; lat: number; lng: number }[] };
      setResults(data.results?.slice(0, 5) ?? []);
    } catch { /* silent */ }
  }

  function selectResult(r: { name: string; lat: number; lng: number }) {
    placePin(r.lat, r.lng);
    onLocationConfirm({ lat: r.lat, lng: r.lng, placeName: r.name });
    setResults([]);
    setQuery(r.name);
  }

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainer} className="h-full w-full" />
      <div className="absolute inset-x-3 top-3 z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); void search(e.target.value); }}
            placeholder="Search place..."
            className="h-9 w-full rounded-lg border border-border bg-background/95 pl-9 pr-3 text-sm shadow-md backdrop-blur-md outline-none placeholder:text-muted-foreground"
          />
        </div>
        {results.length > 0 && (
          <ul className="mt-1 rounded-lg border border-border bg-background shadow-lg">
            {results.map((r, i) => (
              <li key={i}>
                <button type="button" onClick={() => selectResult(r)} className="w-full truncate px-3 py-2 text-left text-sm hover:bg-muted">
                  {r.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="absolute inset-x-3 bottom-3 z-10 text-center">
        <span className="rounded-full bg-background/90 px-3 py-1 text-[11px] text-muted-foreground shadow-sm backdrop-blur-sm">
          Tap the map to drop a pin
        </span>
      </div>
    </div>
  );
}
