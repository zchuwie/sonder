"use client";

import { useEffect, useRef, useState } from "react";
import { Map, Marker } from "maplibre-gl";
import { Expand, MapPin, ShieldCheck } from "lucide-react";
import { useTheme } from "next-themes";
import { getOpenFreeMapStyle } from "@/features/map/lib/openfreemap";
import { FullScreenMapPicker } from "./FullScreenMapPicker";
import type { MarkerData } from "@/features/posts/lib/post-types";

export function MiniMapPreview({
  marker,
  onLocationChange,
  previewImage,
}: {
  marker: MarkerData;
  onLocationChange?: (loc: { lat: number; lng: number; placeName?: string }) => void;
  previewImage?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const pin = useRef<Marker | null>(null);
  const { resolvedTheme } = useTheme();
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number; placeName?: string }>({ lat: marker.lat, lng: marker.lng, placeName: marker.placeName });

  useEffect(() => {
    if (!container.current || map.current) return;
    map.current = new Map({
      container: container.current,
      style: getOpenFreeMapStyle(resolvedTheme),
      center: [currentLocation.lng, currentLocation.lat],
      zoom: 14.5,
      interactive: false,
      attributionControl: false,
    });
    map.current.on("load", () => {
      if (!map.current) return;
      
      let el: HTMLElement | undefined;
      if (previewImage) {
        el = document.createElement("div");
        el.className = "size-8 rounded-lg border-2 border-white bg-black overflow-hidden shadow-md";
        const img = document.createElement("img");
        img.src = previewImage;
        img.className = "size-full object-cover";
        el.appendChild(img);
      }

      pin.current = new Marker(el ? { element: el } : { color: "#137818", scale: 1.2 })
        .setLngLat([currentLocation.lng, currentLocation.lat])
        .addTo(map.current);
    });
    return () => {
      pin.current?.remove();
      pin.current = null;
      map.current?.remove();
      map.current = null;
    };
  }, [currentLocation.lat, currentLocation.lng, resolvedTheme, previewImage]);

  const handleFullScreenDone = (loc: { lat: number; lng: number; placeName?: string }) => {
    setCurrentLocation(loc);
    setShowFullScreen(false);
    onLocationChange?.(loc);
    // Update mini map
    if (map.current && pin.current) {
      pin.current.setLngLat([loc.lng, loc.lat]);
      map.current.flyTo({ center: [loc.lng, loc.lat], zoom: 14.5, duration: 600 });
    }
  };

  return (
    <div className="flex h-full flex-col bg-muted/45">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          ref={container}
          className="size-full"
          aria-label="OpenFreeMap location preview"
        />

        {/* Fullscreen expand button — mobile only */}
        <button
          type="button"
          aria-label="Open full-screen map"
          onClick={() => setShowFullScreen(true)}
          className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm font-medium text-foreground shadow-lg transition hover:scale-105 hover:shadow-xl md:hidden"
        >
          <Expand className="size-4" />
          Expand
        </button>
      </div>
      <div className="hidden gap-2 p-4 text-xs leading-5 text-muted-foreground md:flex">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          Approved posts and selected locations become public. Avoid identifying
          information.
        </p>
      </div>

      {/* ponytail: no portal needed — position:fixed escapes overflow:hidden already.
         Portaling to body broke Radix Dialog (parent) which treated interactions as "outside". */}
      {showFullScreen && (
        <FullScreenMapPicker
          initialLat={currentLocation.lat}
          initialLng={currentLocation.lng}
          initialPlaceName={currentLocation.placeName}
          onDone={handleFullScreenDone}
          onClose={() => setShowFullScreen(false)}
        />
      )}
    </div>
  );
}
