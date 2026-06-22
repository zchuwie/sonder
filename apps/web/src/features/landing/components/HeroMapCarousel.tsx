"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Music2 } from "lucide-react";
import maplibregl from "maplibre-gl";
import { getOpenFreeMapStyle } from "@repo/map-config";
import { useTheme } from "next-themes";
import places from "@/features/landing/data/hero-places.json";

export function HeroMapCarousel() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const { resolvedTheme } = useTheme();
  const [index, setIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const place = places[index]!;

  // Init map + place ALL pins at once
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    const first = places[0]!;
    const m = new maplibregl.Map({
      container: mapContainer.current,
      style: getOpenFreeMapStyle(resolvedTheme),
      center: [first.lng, first.lat],
      zoom: 15,
      attributionControl: false,
      interactive: false,
    });
    m.on("load", () => {
      places.forEach((p) => {
        const mk = new maplibregl.Marker({ color: "#245236" })
          .setLngLat([p.lng, p.lat])
          .addTo(m);
        markers.current.push(mk);
      });
    });
    map.current = m;
    return () => { m.remove(); map.current = null; markers.current = []; };
  }, []);

  // Auto-fly every 15s
  useEffect(() => {
    const timer = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setIndex((i) => (i + 1) % places.length);
        setAnimating(false);
      }, 400);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Fly to place when index changes
  useEffect(() => {
    if (!map.current) return;
    const p = places[index]!;
    map.current.flyTo({ center: [p.lng, p.lat], zoom: 15, speed: 0.8, curve: 1.8 });
  }, [index]);

  return (
    <div className="relative min-h-[280px] sm:min-h-[380px] lg:min-h-[580px]">
      {/* Map */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl border border-white/10 shadow-2xl sm:rotate-3 sm:rounded-[2.5rem]">
        <div ref={mapContainer} className="h-full w-full" />
      </div>

      {/* Thought card */}
      <div
        className="absolute -bottom-16 left-0 right-4 rounded-2xl border border-white/10 bg-[#f5f1e8] p-4 text-[#101713] shadow-2xl transition-all duration-400 sm:-bottom-2 sm:left-2 sm:right-auto sm:max-w-[270px] sm:-rotate-3 sm:rounded-3xl sm:p-5 sm:-left-8"
        style={{
          transform: animating
            ? "translateY(20px) scale(0.95)"
            : "translateY(0) scale(1)",
          opacity: animating ? 0 : 1,
        }}
      >
        <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#607064] sm:mb-4 sm:text-xs">
          <MapPin className="size-3.5 text-[#2f4439]" /> {place.name}
        </div>
        <p className="font-serif text-lg leading-tight sm:text-2xl">
          {place.thought}
        </p>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-[#657067] sm:mt-5 sm:text-xs">
          <Music2 className="size-3.5" /> {place.song}
        </div>
      </div>
    </div>
  );
}
