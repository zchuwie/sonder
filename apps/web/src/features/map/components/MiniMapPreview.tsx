"use client";

import { useEffect, useRef } from "react";
import { Map, Marker } from "maplibre-gl";
import { MapPin, ShieldCheck } from "lucide-react";
import { useTheme } from "next-themes";
import { getOpenFreeMapStyle } from "@/features/map/lib/openfreemap";
import type { MarkerData } from "@/features/posts/lib/post-types";

export function MiniMapPreview({ marker }: { marker: MarkerData }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const pin = useRef<Marker | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!container.current || map.current) return;
    map.current = new Map({
      container: container.current,
      style: getOpenFreeMapStyle(resolvedTheme),
      center: [marker.lng, marker.lat],
      zoom: 14.5,
      interactive: false,
      attributionControl: false,
    });
    map.current.on("load", () => {
      if (!map.current) return;
      pin.current = new Marker({ color: "#137818", scale: 1.2 })
        .setLngLat([marker.lng, marker.lat])
        .addTo(map.current);
    });
    return () => {
      pin.current?.remove();
      pin.current = null;
      map.current?.remove();
      map.current = null;
    };
  }, [marker.lat, marker.lng, resolvedTheme]);

  return (
    <div className="flex h-full flex-col bg-muted/45">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          ref={container}
          className="size-full"
          aria-label="OpenFreeMap location preview"
        />
        <div className="absolute inset-x-2 bottom-2 rounded-xl bg-background/90 p-2 shadow-lg backdrop-blur-md md:inset-x-3 md:bottom-3 md:rounded-2xl md:p-3">
          <p className="flex items-center gap-1.5 truncate text-xs font-semibold md:text-sm">
            <MapPin className="size-3.5 shrink-0 text-primary md:size-4" />{" "}
            {marker.placeName ?? "Selected place"}
          </p>
          <p className="mt-0.5 font-mono text-[9px] text-muted-foreground md:mt-1 md:text-[10px]">
            {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
          </p>
        </div>
      </div>
      <div className="hidden gap-2 p-4 text-xs leading-5 text-muted-foreground md:flex">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          Approved posts and selected locations become public. Avoid identifying
          information.
        </p>
      </div>
    </div>
  );
}
