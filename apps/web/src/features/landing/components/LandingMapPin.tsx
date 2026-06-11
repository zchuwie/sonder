"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Map, Marker, NavigationControl } from "maplibre-gl";
import { ArrowRight, MapPin, RefreshCw, RotateCcw } from "lucide-react";
import { useTheme } from "next-themes";
import { MapSearchBar } from "@/features/map/components/MapSearchBar";
import { getOpenFreeMapStyle } from "@/features/map/lib/openfreemap";
import type { LocationPlaceDTO } from "@/features/map/lib/location-types";
import { AppLoading } from "@/components/shared/AppLoading";

const INITIAL_LOCATION = {
  lat: 14.5832,
  lng: 120.9787,
  name: "Rizal Park",
};

const PIN_STORAGE_KEY = "sonder:landing-pin";

type LocalPin = {
  lat: number;
  lng: number;
  name: string;
};

export function LandingMapPin() {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const marker = useRef<Marker | null>(null);
  const [pin, setPin] = useState<LocalPin>(INITIAL_LOCATION);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const { resolvedTheme } = useTheme();
  const initialTheme = useRef(resolvedTheme);
  const appliedTheme = useRef(resolvedTheme);

  useEffect(() => {
    if (!container.current || map.current) return;

    let storedPin = INITIAL_LOCATION;
    try {
      const stored = localStorage.getItem(PIN_STORAGE_KEY);
      if (stored) storedPin = JSON.parse(stored) as LocalPin;
    } catch {
      localStorage.removeItem(PIN_STORAGE_KEY);
    }
    setPin(storedPin);
    setMapLoaded(false);
    setMapFailed(false);

    map.current = new Map({
      container: container.current,
      style: getOpenFreeMapStyle(initialTheme.current),
      center: [storedPin.lng, storedPin.lat],
      zoom: 13,
      attributionControl: false,
    });
    map.current.addControl(
      new NavigationControl({ showCompass: false }),
      "top-right",
    );
    marker.current = new Marker({ color: "#2f4439", scale: 1.1 })
      .setLngLat([storedPin.lng, storedPin.lat])
      .addTo(map.current);

    const loadTimeout = window.setTimeout(() => setMapFailed(true), 15000);
    map.current.once("load", () => {
      window.clearTimeout(loadTimeout);
      appliedTheme.current = initialTheme.current;
      setMapFailed(false);
      setMapLoaded(true);
      map.current?.resize();
    });

    map.current.on("click", ({ lngLat }) => {
      const next = {
        lat: lngLat.lat,
        lng: lngLat.lng,
        name: "Your selected place",
      };
      marker.current?.setLngLat([next.lng, next.lat]);
      setPin(next);
      localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(next));
    });

    const resizeObserver = new ResizeObserver(() => map.current?.resize());
    resizeObserver.observe(container.current);

    return () => {
      window.clearTimeout(loadTimeout);
      resizeObserver.disconnect();
      marker.current?.remove();
      marker.current = null;
      map.current?.remove();
      map.current = null;
    };
  }, [retryKey]);

  useEffect(() => {
    if (!map.current || !mapLoaded || appliedTheme.current === resolvedTheme) {
      return;
    }
    appliedTheme.current = resolvedTheme;
    setMapLoaded(false);
    map.current.setStyle(getOpenFreeMapStyle(resolvedTheme));
    map.current.once("style.load", () => {
      setMapLoaded(true);
      map.current?.resize();
    });
  }, [mapLoaded, resolvedTheme]);

  const selectPlace = (place: LocationPlaceDTO) => {
    const next = { lat: place.lat, lng: place.lng, name: place.name };
    setPin(next);
    localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(next));
    marker.current?.setLngLat([place.lng, place.lat]);
    map.current?.flyTo({
      center: [place.lng, place.lat],
      zoom: 15,
      speed: 1.4,
    });
  };

  const reset = () => {
    setPin(INITIAL_LOCATION);
    localStorage.removeItem(PIN_STORAGE_KEY);
    marker.current?.setLngLat([INITIAL_LOCATION.lng, INITIAL_LOCATION.lat]);
    map.current?.flyTo({
      center: [INITIAL_LOCATION.lng, INITIAL_LOCATION.lat],
      zoom: 13,
    });
  };

  return (
    <div className="relative min-h-[520px] overflow-hidden rounded-[2rem] border border-black/10 bg-[#dfe4d8] shadow-2xl shadow-black/20 dark:border-white/10 sm:min-h-[620px]">
      <div
        ref={container}
        className="absolute inset-0"
        aria-label="Interactive OpenFreeMap preview. Click the map to move your locally stored pin."
      />

      {!mapLoaded && !mapFailed && (
        <AppLoading contained label="Loading the map..." />
      )}
      {mapFailed && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#eef0e5] p-6 text-center text-[#101713] dark:bg-[#101713] dark:text-[#f5f1e8]">
          <div>
            <MapPin className="mx-auto size-8 text-[#2f4439] dark:text-[#a8ba63]" />
            <p className="mt-4 font-serif text-3xl">The map could not load.</p>
            <p className="mt-2 max-w-sm text-xs leading-6 text-[#657067] dark:text-[#aeb7af]">
              Check your connection, then try loading OpenFreeMap again.
            </p>
            <button
              type="button"
              onClick={() => setRetryKey((key) => key + 1)}
              className="mx-auto mt-5 flex items-center gap-2 rounded-full bg-[#2f4439] px-5 py-3 text-xs font-bold text-white dark:bg-[#a8ba63] dark:text-[#101713]"
            >
              <RefreshCw className="size-3.5" /> Try again
            </button>
          </div>
        </div>
      )}

      <div className="absolute inset-x-4 top-4 z-10 sm:left-5 sm:right-auto sm:w-[360px]">
        <MapSearchBar onPlaceSelect={selectPlace} />
      </div>

      <div className="pointer-events-none absolute inset-x-4 bottom-4 z-10 flex flex-col items-stretch gap-3 sm:inset-x-6 sm:bottom-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="pointer-events-auto max-w-[390px] rounded-3xl border border-white/70 bg-[#f9f7f0]/95 p-5 text-[#101713] shadow-2xl backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between gap-4 text-[10px] font-bold uppercase tracking-[0.15em] text-[#647067]">
            <span>Your local pin</span>
            <span className="rounded-full bg-[#e5eadc] px-2.5 py-1">
              Stored on this device
            </span>
          </div>
          <p className="font-serif text-2xl leading-tight">{pin.name}</p>
          <div className="mt-4 flex items-center justify-between gap-4 text-xs text-[#687169]">
            <span className="flex min-w-0 items-center gap-1">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">Selected location</span>
            </span>
            <span className="shrink-0 font-mono text-[10px]">
              {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}
            </span>
          </div>
        </div>

        <div className="pointer-events-auto flex gap-2 self-end">
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-2 rounded-full border border-white/70 bg-white/90 px-4 py-3 text-xs font-bold text-[#2f4439] shadow-lg backdrop-blur transition hover:bg-white"
          >
            <RotateCcw className="size-3.5" /> Reset pin
          </button>
          <Link
            href="/map"
            className="flex items-center gap-2 rounded-full bg-[#2f4439] px-4 py-3 text-xs font-bold text-white shadow-lg transition hover:bg-[#3b5446]"
          >
            Open full map <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      <div className="pointer-events-none absolute right-4 top-24 z-10 rounded-full bg-[#101713]/80 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur sm:right-5">
        Click anywhere to pin
      </div>
    </div>
  );
}
