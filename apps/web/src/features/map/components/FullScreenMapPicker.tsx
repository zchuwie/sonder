"use client";

import { useEffect, useRef, useState } from "react";
import { Map, Marker, NavigationControl } from "maplibre-gl";
import { ArrowLeft, Check, X } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { getOpenFreeMapStyle } from "@/features/map/lib/openfreemap";
import { reverseGeocode } from "@/features/map/client/reverse-geocode";

type PickedLocation = { lat: number; lng: number; placeName?: string };

export function FullScreenMapPicker({
  initialLat,
  initialLng,
  initialPlaceName,
  onDone,
  onClose,
}: {
  initialLat: number;
  initialLng: number;
  initialPlaceName?: string;
  onDone: (location: PickedLocation) => void;
  onClose: () => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const { resolvedTheme } = useTheme();
  const [pinned, setPinned] = useState<PickedLocation | null>({
    lat: initialLat,
    lng: initialLng,
    placeName: initialPlaceName,
  });

  useEffect(() => {
    if (!container.current || mapRef.current) return;

    const el = container.current;

    // ponytail: RAF to ensure container is laid out and has dimensions
    const frame = requestAnimationFrame(() => {
      if (!el || mapRef.current) return;

      const instance = new Map({
        container: el,
        style: getOpenFreeMapStyle(resolvedTheme),
        center: [initialLng, initialLat],
        zoom: 15,
        attributionControl: false,
      });
      mapRef.current = instance;
      instance.addControl(new NavigationControl(), "bottom-right");

      instance.on("load", () => {
        // Ensure map fills container after load
        instance.resize();

        markerRef.current = new Marker({ color: "#137818", scale: 1.3, draggable: true })
          .setLngLat([initialLng, initialLat])
          .addTo(instance);

        markerRef.current.on("dragend", async () => {
          const lngLat = markerRef.current!.getLngLat();
          const name = await reverseGeocode(lngLat.lat, lngLat.lng);
          setPinned({ lat: lngLat.lat, lng: lngLat.lng, placeName: name });
        });
      });

      // Click map → move marker
      instance.on("click", async (e) => {
        const { lat, lng } = e.lngLat;
        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat]);
        } else {
          markerRef.current = new Marker({ color: "#137818", scale: 1.3, draggable: true })
            .setLngLat([lng, lat])
            .addTo(instance);
          markerRef.current.on("dragend", async () => {
            const lngLat = markerRef.current!.getLngLat();
            const name = await reverseGeocode(lngLat.lat, lngLat.lng);
            setPinned({ lat: lngLat.lat, lng: lngLat.lng, placeName: name });
          });
        }
        const name = await reverseGeocode(lat, lng);
        setPinned({ lat, lng, placeName: name });
      });
    });

    return () => {
      cancelAnimationFrame(frame);
      markerRef.current?.remove();
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [initialLat, initialLng, resolvedTheme]);

  const handleClear = () => {
    if (markerRef.current && mapRef.current) {
      markerRef.current.setLngLat([initialLng, initialLat]);
      mapRef.current.flyTo({ center: [initialLng, initialLat], zoom: 15, duration: 400 });
      setPinned({ lat: initialLat, lng: initialLng, placeName: initialPlaceName });
    }
  };

  return (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) { e.stopPropagation(); onClose(); } }}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal panel */}
      <div
        className="relative flex h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border/50 bg-background shadow-2xl md:h-[calc(100dvh-3rem)] md:w-[calc(100vw-3rem)] md:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex shrink-0 items-center justify-between border-b px-4 py-3 md:px-6">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 rounded-xl"
            onClick={(e) => { e.stopPropagation(); onClose(); }}
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <span className="text-base font-medium">Pick a location</span>
          <div className="w-20" />
        </div>

        {/* Map container — needs explicit height for maplibre */}
        <div
          ref={container}
          className="relative flex-1"
          style={{ minHeight: 0 }}
        />

        {/* Bottom bar */}
        <div className="flex shrink-0 items-center justify-between border-t bg-background px-4 py-3 md:px-6">
          <div className="min-w-0 flex-1 pr-4">
            {pinned && (
              <p className="truncate text-sm text-muted-foreground">
                📍 {pinned.placeName ?? `${pinned.lat.toFixed(5)}, ${pinned.lng.toFixed(5)}`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={handleClear}>
              <X className="size-3.5" />
              Clear
            </Button>
            <Button
              size="sm"
              className="gap-1.5 rounded-xl"
              disabled={!pinned}
              onClick={() => pinned && onDone(pinned)}
            >
              <Check className="size-3.5" />
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
