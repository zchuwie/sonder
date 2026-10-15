"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Music2 } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import maplibregl from "maplibre-gl";
import { getOpenFreeMapStyle } from "@repo/map-config";
import places from "@/features/landing/data/hero-places.json";
import type { LandingPostPreview } from "./ThoughtCarousel";

export function HeroMapCarousel({ posts }: { posts: LandingPostPreview[] }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const [index, setIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const reduceMotion = useReducedMotion();
  const mapPlaces = useMemo(() => posts.length > 0
    ? posts.slice(0, 3).map((post) => ({
        lat: post.lat,
        lng: post.lng,
        name: post.place_name || "Somewhere on the map",
        thought: post.title,
        song: post.music ? `${post.music.title}${post.music.artist ? ` · ${post.music.artist}` : ""}` : null,
      }))
    : places, [posts]);
  const place = mapPlaces[index]!;

  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    const first = mapPlaces[0]!;
    const m = new maplibregl.Map({
      container: mapContainer.current,
      style: getOpenFreeMapStyle(),
      center: [first.lng, first.lat],
      zoom: 15,
      attributionControl: false,
      interactive: false,
    });
    m.on("load", () => {
      mapPlaces.forEach((p) => {
        const mk = new maplibregl.Marker({ color: "#245236" })
          .setLngLat([p.lng, p.lat])
          .addTo(m);
        markers.current.push(mk);
      });
    });
    map.current = m;
    return () => { m.remove(); map.current = null; markers.current = []; };
  }, [mapPlaces]);

  useEffect(() => {
    if (reduceMotion) return;
    let fadeTimer: ReturnType<typeof setTimeout>;
    const timer = setInterval(() => {
      if (document.hidden) return;
      setAnimating(true);
      fadeTimer = setTimeout(() => {
        if (!document.hidden) setIndex((i) => (i + 1) % mapPlaces.length);
        setAnimating(false);
      }, 400);
    }, 30000);
    return () => { clearInterval(timer); clearTimeout(fadeTimer); };
  }, [mapPlaces.length, reduceMotion]);

  useEffect(() => {
    if (!map.current) return;
    const p = mapPlaces[index]!;
    if (reduceMotion) {
      map.current.jumpTo({ center: [p.lng, p.lat], zoom: 15 });
    } else {
      map.current.flyTo({ center: [p.lng, p.lat], zoom: 15, speed: 0.8, curve: 1.8 });
    }
  }, [index, mapPlaces, reduceMotion]);

  return (
    <div className="relative min-h-[340px] sm:min-h-[460px] lg:min-h-[540px]">
      <div className="absolute inset-0 overflow-hidden rounded-2xl border border-white/10 shadow-2xl sm:rotate-3 sm:rounded-[2.5rem]">
        <div ref={mapContainer} className="h-full w-full" />
      </div>

      <div
        className="absolute -bottom-16 left-0 right-4 rounded-2xl border border-white/10 bg-[#f5f1e8] p-4 text-[#101713] shadow-2xl transition-all duration-400 sm:-bottom-2 sm:left-2 sm:right-auto sm:max-w-[270px] sm:-rotate-3 sm:rounded-3xl sm:p-5 sm:-left-8"
        style={{
          transform: animating
            ? "translateY(20px) scale(0.95)"
            : "translateY(0) scale(1)",
          opacity: animating ? 0 : 1,
        }}
      >
        <div className="mb-2 flex items-center gap-2 text-[10px] font-bold text-[#607064] sm:mb-4 sm:text-xs">
          <MapPin className="size-3.5 text-[#2f4439]" /> {posts.length > 0 ? "From" : "Example thought ·"} {place.name}
        </div>
        <p className="font-serif text-lg leading-tight sm:text-2xl">
          {place.thought}
        </p>
        {place.song && <div className="mt-3 flex items-center gap-2 text-[10px] text-[#657067] sm:mt-5 sm:text-xs">
          <Music2 className="size-3.5" /> {place.song}
        </div>}
      </div>
    </div>
  );
}
