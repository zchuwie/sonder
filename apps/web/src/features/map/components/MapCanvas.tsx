"use client";

import { useEffect, useRef, useState } from "react";
import { FiMapPin } from "react-icons/fi";
import {
  Map,
  Marker as MLMarker,
  NavigationControl,
  GeoJSONSource,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTheme } from "next-themes";
import { MapPostPreview } from "./MapPostPreview";
import type { MarkerData } from "@/features/posts/lib/post-types";
import { getOpenFreeMapStyle } from "@/features/map/lib/openfreemap";
import { AppLoading } from "@/components/shared/AppLoading";

const PIN_COLOR = "#137818";

type FlyToTarget = { lat: number; lng: number; zoom?: number } | null;

type Props = {
  markers: MarkerData[];
  selectedMarkerId: string | null;
  onMarkerAdd: (marker: MarkerData) => void;
  onMarkerSelect: (id: string | null) => void;
  onCreatePost: () => void;
  onViewGroup: () => void;
  flyTo?: FlyToTarget;
};

export default function MapCanvas({
  markers,
  selectedMarkerId,
  onMarkerAdd,
  onMarkerSelect,
  onCreatePost,
  onViewGroup,
  flyTo,
}: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
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
  const [mapLoaded, setMapLoaded] = useState(false);
  const [previewPosition, setPreviewPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [holdIndicator, setHoldIndicator] = useState<{
    x: number;
    y: number;
    key: number;
  } | null>(null);

  onMarkerSelectRef.current = onMarkerSelect;
  onMarkerAddRef.current = onMarkerAdd;
  markersRef.current = markers;

  const buildGeoJSON = (items: MarkerData[]): GeoJSON.FeatureCollection => ({
    type: "FeatureCollection",
    features: items
      .filter((m) => m.source !== "search" && m.posts.length > 0)
      .map((m) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [m.lng, m.lat] },
        properties: { id: m.id, postCount: m.posts.length },
      })),
  });

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    const styleUrl = getOpenFreeMapStyle(resolvedThemeRef.current);

    map.current = new Map({
      container: mapContainer.current,
      style: styleUrl,
      center: [lng, lat],
      zoom: zoom,
    });

    map.current.getCanvas().style.cursor = "pointer";

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

      map.current.addLayer({
        id: "unclustered-count",
        type: "symbol",
        source: "pins",
        filter: [
          "all",
          ["!", ["has", "point_count"]],
          [">", ["get", "postCount"], 1],
        ],
        layout: {
          "text-field": ["to-string", ["get", "postCount"]],
          "text-size": 10,
          "text-font": ["Noto Sans Bold", "Arial Unicode MS Bold"],
        },
        paint: { "text-color": "#ffffff" },
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
      map.current.on("mouseleave", "clusters", () => setCursor("pointer"));
      map.current.on("mouseenter", "unclustered-point", () =>
        setCursor("pointer"),
      );
      map.current.on("mouseleave", "unclustered-point", () =>
        setCursor("pointer"),
      );
    });

    // Right-click → add pin
    map.current.on("contextmenu", (e) => {
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
    const styleUrl = getOpenFreeMapStyle(resolvedTheme);

    map.current.setStyle(styleUrl, {
      transformStyle: (previousStyle, nextStyle) => {
        const customSourceIds = ["pins"];
        const customLayerIds = [
          "clusters",
          "cluster-count",
          "unclustered-point",
          "unclustered-count",
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

    const searchPins = markers.filter(
      (m) => m.source === "search" && m.posts.length > 0,
    );
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
    if (!map.current || !selectedMarkerId) {
      setPreviewPosition(null);
      return;
    }
    const selected = markers.find((marker) => marker.id === selectedMarkerId);
    if (!selected) return;

    const update = () => {
      const point = map.current?.project([selected.lng, selected.lat]);
      if (point) setPreviewPosition({ x: point.x, y: point.y });
    };
    update();
    map.current.on("move", update);
    return () => {
      map.current?.off("move", update);
    };
  }, [markers, selectedMarkerId]);

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
          0% { transform: scale(0.72); opacity: 0.35; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes sonder-ring-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.6; }
        }
      `}</style>

      <div ref={mapContainer} className="w-full h-full" />
      {!mapLoaded && <AppLoading contained label="Loading the map..." />}

      {selectedMarkerId &&
        previewPosition &&
        markers.some((marker) => marker.id === selectedMarkerId) && (
          <MapPostPreview
            marker={markers.find((marker) => marker.id === selectedMarkerId)!}
            position={previewPosition}
            onClose={() => onMarkerSelect(null)}
            onCreatePost={onCreatePost}
            onViewGroup={onViewGroup}
          />
        )}

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
          <div
            style={{
              position: "relative",
              width: 64,
              height: 64,
              display: "grid",
              placeItems: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: "3px solid rgba(255,255,255,0.35)",
                animation: "sonder-ring-pulse 1s ease-in-out infinite",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 10,
                borderRadius: "50%",
                border: "3px solid var(--primary)",
                animation: "sonder-ring-progress 0.6s linear forwards",
                boxSizing: "border-box",
              }}
            />
            <FiMapPin
              size={24}
              style={{ color: "var(--primary)", position: "relative" }}
            />
          </div>
        </div>
      )}

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
