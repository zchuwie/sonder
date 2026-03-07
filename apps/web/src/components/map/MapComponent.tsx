"use client";

import { useEffect, useRef, useState } from "react";
import {
  Map,
  Marker as MLMarker,
  NavigationControl,
  GeoJSONSource,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTheme } from "next-themes";
import { type MarkerData } from "../posts/PostPopup";

type Mode = "grab" | "mark";

const PIN_COLOR = "#137818";

const MAP_STYLES = {
  light: "https://tiles.openfreemap.org/styles/liberty",
  dark: "https://tiles.openfreemap.org/styles/fiord",
} as const;

type FlyToTarget = { lat: number; lng: number; zoom?: number } | null;

type Props = {
  markers: MarkerData[];
  selectedMarkerId: string | null;
  onMarkerAdd: (marker: MarkerData) => void;
  onMarkerSelect: (id: string | null) => void;
  flyTo?: FlyToTarget;
};

export default function MapContainer({
  markers,
  onMarkerAdd,
  onMarkerSelect,
  flyTo,
}: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const modeRef = useRef<Mode>("grab");
  const onMarkerSelectRef = useRef(onMarkerSelect);
  const onMarkerAddRef = useRef(onMarkerAdd);
  const markersRef = useRef<MarkerData[]>(markers);
  const searchMarkersRef = useRef<globalThis.Map<string, MLMarker>>(
    new globalThis.Map(),
  );
  const { resolvedTheme } = useTheme();
  const resolvedThemeRef = useRef(resolvedTheme);
  resolvedThemeRef.current = resolvedTheme;

  const lng = 120.9842;
  const lat = 14.5995;
  const zoom = 12;
  const [mode, setMode] = useState<Mode>("grab");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [holdIndicator, setHoldIndicator] = useState<{
    x: number;
    y: number;
    key: number;
  } | null>(null);

  onMarkerSelectRef.current = onMarkerSelect;
  onMarkerAddRef.current = onMarkerAdd;
  markersRef.current = markers;

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const buildGeoJSON = (items: MarkerData[]): GeoJSON.FeatureCollection => ({
    type: "FeatureCollection",
    features: items
      .filter((m) => m.source !== "search")
      .map((m) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [m.lng, m.lat] },
        properties: { id: m.id, postCount: m.posts.length },
      })),
  });

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    const styleUrl =
      resolvedThemeRef.current === "dark" ? MAP_STYLES.dark : MAP_STYLES.light;

    map.current = new Map({
      container: mapContainer.current,
      style: styleUrl,
      center: [lng, lat],
      zoom: zoom,
    });

    map.current.doubleClickZoom.disable();

    map.current.addControl(new NavigationControl());

    // GeoJSON
    map.current.on("load", () => {
      if (!map.current) return;
      setMapLoaded(true);

      map.current.addSource("pins", {
        type: "geojson",
        data: buildGeoJSON(markersRef.current),
        cluster: true,
        clusterMaxZoom: 13,
        clusterRadius: 50,
      });

      // Cluster bubble
      map.current.addLayer({
        id: "clusters",
        type: "circle",
        source: "pins",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": PIN_COLOR,
          "circle-radius": ["step", ["get", "point_count"], 13, 10, 17, 30, 21],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Cluster count label
      map.current.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "pins",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-size": 11,
          "text-font": ["Noto Sans Bold", "Arial Unicode MS Bold"],
        },
        paint: { "text-color": "#ffffff" },
      });

      // Individual pin — green + larger when it has posts, gray + smaller when empty
      map.current.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "pins",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "case",
            [">", ["get", "postCount"], 0],
            PIN_COLOR,
            "#9ca3af",
          ],
          "circle-radius": ["case", [">", ["get", "postCount"], 0], 9, 6],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      // Click cluster → zoom in
      map.current.on("click", "clusters", (e) => {
        const features = map.current!.queryRenderedFeatures(e.point, {
          layers: ["clusters"],
        });
        if (!features.length || !features[0]) return;
        const clusterId = (features[0].properties?.cluster_id ?? 0) as number;
        const geometry = features[0].geometry as GeoJSON.Point | undefined;
        if (!geometry) return;
        (map.current!.getSource("pins") as GeoJSONSource)
          .getClusterExpansionZoom(clusterId)
          .then((zoom) => {
            const coords = geometry.coordinates as [number, number];
            map.current!.easeTo({ center: coords, zoom });
          });
      });

      // Click individual pin → open sidebar
      map.current.on("click", "unclustered-point", (e) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (id) onMarkerSelectRef.current(id);
      });

      // Cursor feedback
      const setCursor = (cur: string) => {
        if (map.current) map.current.getCanvas().style.cursor = cur;
      };
      map.current.on("mouseenter", "clusters", () => setCursor("pointer"));
      map.current.on("mouseleave", "clusters", () =>
        setCursor(modeRef.current === "mark" ? "pointer" : "grab"),
      );
      map.current.on("mouseenter", "unclustered-point", () =>
        setCursor("pointer"),
      );
      map.current.on("mouseleave", "unclustered-point", () =>
        setCursor(modeRef.current === "mark" ? "pointer" : "grab"),
      );
    });

    // Double-click → add pin
    map.current.on("dblclick", (e) => {
      if (modeRef.current !== "mark") return;
      e.preventDefault();

      onMarkerAddRef.current({
        id: crypto.randomUUID(),
        lat: e.lngLat.lat,
        lng: e.lngLat.lng,
        posts: [],
      });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Swap map style when theme changes
  useEffect(() => {
    if (!map.current) return;
    const styleUrl =
      resolvedTheme === "dark" ? MAP_STYLES.dark : MAP_STYLES.light;

    map.current.setStyle(styleUrl, {
      transformStyle: (previousStyle, nextStyle) => {
        const customSourceIds = ["pins"];
        const customLayerIds = [
          "clusters",
          "cluster-count",
          "unclustered-point",
        ];

        const preservedSources: typeof nextStyle.sources = {};
        for (const id of customSourceIds) {
          if (previousStyle?.sources?.[id]) {
            preservedSources[id] = previousStyle.sources[id]!;
          }
        }

        const preservedLayers =
          previousStyle?.layers?.filter((l) => customLayerIds.includes(l.id)) ??
          [];

        return {
          ...nextStyle,
          sources: { ...nextStyle.sources, ...preservedSources },
          layers: [...nextStyle.layers, ...preservedLayers],
        };
      },
    });
  }, [resolvedTheme]);

  // Sync manual markers → GeoJSON circle layer
  useEffect(() => {
    if (!map.current) return;
    const source = map.current.getSource("pins") as GeoJSONSource | undefined;
    if (!source) return;
    source.setData(buildGeoJSON(markers));
  }, [markers]);

  // Sync search markers → MapLibre HTML Marker (default teardrop)
  useEffect(() => {
    if (!map.current) return;

    const searchPins = markers.filter((m) => m.source === "search");
    const currentIds = new Set(searchMarkersRef.current.keys());
    const newIds = new Set(searchPins.map((m) => m.id));

    // Remove stale
    for (const id of currentIds) {
      if (!newIds.has(id)) {
        searchMarkersRef.current.get(id)?.remove();
        searchMarkersRef.current.delete(id);
      }
    }

    // Add new
    for (const pin of searchPins) {
      if (searchMarkersRef.current.has(pin.id)) continue;
      const mlMarker = new MLMarker()
        .setLngLat([pin.lng, pin.lat])
        .addTo(map.current);
      mlMarker.getElement().style.cursor = "pointer";
      mlMarker.getElement().addEventListener("click", (e) => {
        e.stopPropagation();
        onMarkerSelectRef.current(pin.id);
      });
      searchMarkersRef.current.set(pin.id, mlMarker);
    }
  }, [markers]);

  // Fly to a location when the flyTo prop changes
  useEffect(() => {
    if (!flyTo || !map.current) return;
    map.current.flyTo({
      center: [flyTo.lng, flyTo.lat],
      zoom: flyTo.zoom ?? 15,
      speed: 1.4,
      curve: 1.5,
    });
  }, [flyTo]);

  useEffect(() => {
    if (!map.current) return;

    const canvas = map.current.getCanvas();
    canvas.style.cursor = mode === "mark" ? "pointer" : "grab";
  }, [mode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (e.key === "m" || e.key === "M") setMode("mark");
      if (e.key === "g" || e.key === "G") setMode("grab");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Mobile: 2-second long-press to drop a pin
  useEffect(() => {
    if (!mapLoaded || !map.current) return;
    const canvas = map.current.getCanvas();

    let timer: ReturnType<typeof setTimeout> | null = null;
    let startX = 0;
    let startY = 0;
    let holdKey = 0;

    const cancel = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      setHoldIndicator(null);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0]!;
      const rect = canvas.getBoundingClientRect();
      startX = t.clientX;
      startY = t.clientY;
      const relX = t.clientX - rect.left;
      const relY = t.clientY - rect.top;

      const hit = map.current!.queryRenderedFeatures([relX, relY], {
        layers: ["unclustered-point", "clusters"],
      });
      if (hit.length > 0) return;

      holdKey++;
      setHoldIndicator({ x: relX, y: relY, key: holdKey });

      timer = setTimeout(() => {
        if (!map.current) return;
        const lngLat = map.current.unproject([relX, relY]);
        onMarkerAddRef.current({
          id: crypto.randomUUID(),
          lat: lngLat.lat,
          lng: lngLat.lng,
          posts: [],
        });
        setHoldIndicator(null);
        timer = null;
      }, 600);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!timer) return;
      const t = e.touches[0]!;
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.sqrt(dx * dx + dy * dy) > 8) cancel();
    };

    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    canvas.addEventListener("touchend", cancel);
    canvas.addEventListener("touchcancel", cancel);

    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", cancel);
      canvas.removeEventListener("touchcancel", cancel);
      cancel();
    };
  }, [mapLoaded]);

  return (
    <div className="relative w-full h-full">
      <style>{`
        @keyframes sonder-ring-progress {
          to { stroke-dashoffset: 0; }
        }
        @keyframes sonder-ring-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.6; }
        }
      `}</style>

      <div ref={mapContainer} className="w-full h-full" />

      {/* Long-press progress ring (mobile) */}
      {holdIndicator && (
        <div
          key={holdIndicator.key}
          style={{
            position: "absolute",
            left: holdIndicator.x,
            top: holdIndicator.y,
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex: 50,
          }}
        >
          <svg width="64" height="64" viewBox="0 0 64 64">
            {/* Backdrop ring */}
            <circle
              cx="32"
              cy="32"
              r="24"
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="3"
            />
            {/* Animated progress ring */}
            <circle
              cx="32"
              cy="32"
              r="24"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="3"
              strokeLinecap="round"
              style={{
                strokeDasharray: 150.8,
                strokeDashoffset: 150.8,
                animation: "sonder-ring-progress 0.6s linear forwards",
                transformOrigin: "32px 32px",
                transform: "rotate(-90deg)",
              }}
            />
            {/* Center dot */}
            <circle
              cx="32"
              cy="32"
              r="5"
              fill="var(--primary)"
              style={{ animation: "sonder-ring-pulse 1s ease-in-out infinite" }}
            />
          </svg>
        </div>
      )}

      {/* Mode buttons — desktop only */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden sm:flex gap-2">
        <button
          onClick={() => setMode("grab")}
          style={
            mode === "grab"
              ? {
                  background: "var(--primary)",
                  color: "var(--primary-foreground)",
                }
              : {
                  background: "var(--card)",
                  color: "var(--foreground)",
                  border: "1px solid var(--border)",
                }
          }
          className="px-4 py-2 rounded-full text-sm font-medium shadow transition-all cursor-pointer"
        >
          ✋ Grab (G)
        </button>
        <button
          onClick={() => setMode("mark")}
          style={
            mode === "mark"
              ? {
                  background: "var(--primary)",
                  color: "var(--primary-foreground)",
                }
              : {
                  background: "var(--card)",
                  color: "var(--foreground)",
                  border: "1px solid var(--border)",
                }
          }
          className="px-4 py-2 rounded-full text-sm font-medium shadow transition-all cursor-pointer"
        >
          📍 Mark (M)
        </button>
      </div>

      {/* Mobile hint */}
      <div
        className="absolute bottom-5 left-1/2 -translate-x-1/2 sm:hidden"
        style={{ pointerEvents: "none" }}
      >
        <span
          className="px-3 py-1.5 rounded-full text-xs font-medium"
          style={{
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(8px)",
            color: "#fff",
            letterSpacing: "0.01em",
          }}
        >
          Hold to drop a pin
        </span>
      </div>
    </div>
  );
}
