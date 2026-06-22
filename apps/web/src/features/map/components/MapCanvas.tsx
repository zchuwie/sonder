"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { MapPin } from "lucide-react";
import {
  Map,
  Marker as MLMarker,
  NavigationControl,
  GeoJSONSource,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useTheme } from "next-themes";
import {
  addPinMarkerImage,
  createPinMarkerElement,
} from "@/features/map/lib/map-markers";
import { MapPostPreview } from "./MapPostPreview";
import type { MarkerData } from "@/features/posts/lib/post-types";
import { getOpenFreeMapStyle } from "@/features/map/lib/openfreemap";
import { AppLoading } from "@/components/shared/AppLoading";

type FlyToTarget = {
  lat: number;
  lng: number;
  zoom?: number;
  frameRightPanel?: boolean;
} | null;
export type MapViewport = {
  center: { lat: number; lng: number };
  bounds: { north: number; south: number; east: number; west: number };
};

type Props = {
  markers: MarkerData[];
  selectedMarkerId: string | null;
  onMarkerAdd: (marker: MarkerData) => void;
  onMarkerSelect: (id: string | null) => void;
  onCreatePost: () => void;
  onViewGroup: () => void;
  onSelectPost?: (post: MarkerData["posts"][number]) => void;
  onViewportChange?: (viewport: MapViewport) => void;
  flyTo?: FlyToTarget;
};

type HoverPreview = {
  x: number;
  y: number;
  title: string;
  detail: string;
} | null;

function contentSummary(posts: MarkerData["posts"]) {
  const types = new Set<string>();
  for (const post of posts) {
    if (post.imageUrl) types.add("Photos");
    if (post.music) types.add("Songs");
    if (!post.imageUrl && !post.music) types.add("Text");
  }
  return types.size ? [...types].join(" + ") : "Text";
}

export default function MapCanvas({
  markers,
  selectedMarkerId,
  onMarkerAdd,
  onMarkerSelect,
  onCreatePost,
  onViewGroup,
  onSelectPost,
  onViewportChange,
  flyTo,
}: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const onMarkerSelectRef = useRef(onMarkerSelect);
  const onMarkerAddRef = useRef(onMarkerAdd);
  const onViewportChangeRef = useRef(onViewportChange);
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
  const [holdIndicator, setHoldIndicator] = useState<{
    x: number;
    y: number;
    key: number;
  } | null>(null);
  const [previewPosition, setPreviewPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [hoverPreview, setHoverPreview] = useState<HoverPreview>(null);

  onMarkerSelectRef.current = onMarkerSelect;
  onMarkerAddRef.current = onMarkerAdd;
  onViewportChangeRef.current = onViewportChange;
  markersRef.current = markers;

  const buildGeoJSON = (items: MarkerData[]): GeoJSON.FeatureCollection => ({
    type: "FeatureCollection",
    features: items
      .filter((m) => m.source !== "search" && (m.posts.length > 0 || m.source === "manual"))
      .map((m) => ({
        type: "Feature",
        id: m.id,
        geometry: { type: "Point", coordinates: [m.lng, m.lat] },
        properties: {
          id: m.id,
          postCount: m.posts.length,
          content: m.posts.length > 0 ? contentSummary(m.posts) : "new",
        },
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

    map.current.addControl(new NavigationControl(), "bottom-left");
    map.current.on("styleimagemissing", (event) => {
      if (event.id === "sonder-map-pin" && map.current)
        void addPinMarkerImage(map.current);
    });

    const reportViewport = () => {
      if (!map.current) return;
      const center = map.current.getCenter();
      const bounds = map.current.getBounds();
      onViewportChangeRef.current?.({
        center: { lat: center.lat, lng: center.lng },
        bounds: {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        },
      });
    };
    map.current.on("moveend", reportViewport);

    // GeoJSON
    map.current.on("load", async () => {
      if (!map.current) return;
      await addPinMarkerImage(map.current);
      setMapLoaded(true);
      reportViewport();

      map.current.addSource("pins", {
        type: "geojson",
        data: buildGeoJSON(markersRef.current),
        promoteId: "id",
        cluster: true,
        clusterMaxZoom: 13,
        clusterRadius: 50,
      });

      map.current.addLayer({
        id: "clusters",
        type: "symbol",
        source: "pins",
        filter: ["has", "point_count"],
        layout: {
          "icon-image": "sonder-map-pin",
          "icon-size": [
            "step",
            ["get", "point_count"],
            0.82,
            10,
            0.95,
            30,
            1.08,
          ],
          "icon-anchor": "bottom",
          "icon-allow-overlap": true,
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
          "text-offset": [0, -1.9],
        },
        paint: { "text-color": "#ffffff" },
      });

      // Individual pin — green + larger when it has posts, gray + smaller when empty
      map.current.addLayer({
        id: "unclustered-point",
        type: "symbol",
        source: "pins",
        filter: ["!", ["has", "point_count"]],
        layout: {
          "icon-image": "sonder-map-pin",
          "icon-size": 0.72,
          "icon-anchor": "bottom",
          "icon-allow-overlap": true,
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
          "text-offset": [0, -1.95],
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
        if (id) {
          setHoverPreview(null);
          onMarkerSelectRef.current(id);
        }
      });

      // Cursor feedback
      const setCursor = (cur: string) => {
        if (map.current) map.current.getCanvas().style.cursor = cur;
      };
      map.current.on("mouseenter", "clusters", async (event) => {
        setCursor("pointer");
        const feature = event.features?.[0];
        const count = Number(feature?.properties?.point_count ?? 0);
        const clusterId = feature?.properties?.cluster_id as number | undefined;
        let detail = "Mixed posts";
        if (clusterId !== undefined) {
          const leaves = await (map.current?.getSource("pins") as GeoJSONSource)
            .getClusterLeaves(clusterId, 25, 0)
            .catch(() => []);
          detail =
            [
              ...new Set(
                leaves.flatMap((leaf) =>
                  String(leaf.properties?.content ?? "")
                    .split(" + ")
                    .filter(Boolean),
                ),
              ),
            ].join(" + ") || detail;
        }
        setHoverPreview({
          x: event.point.x,
          y: event.point.y,
          title: `${count} thoughts nearby`,
          detail,
        });
      });
      map.current.on("mousemove", "clusters", (event) => {
        setHoverPreview(
          (preview) =>
            preview && { ...preview, x: event.point.x, y: event.point.y },
        );
      });
      map.current.on("mouseleave", "clusters", () => {
        setCursor("pointer");
        setHoverPreview(null);
      });
      map.current.on("mouseenter", "unclustered-point", (event) => {
        setCursor("pointer");
        const feature = event.features?.[0];
        const id = feature?.properties?.id as string | undefined;
        const marker = markersRef.current.find((item) => item.id === id);
        if (marker)
          setHoverPreview({
            x: event.point.x,
            y: event.point.y,
            title: `${marker.posts.length} ${
              marker.posts.length === 1 ? "thought" : "thoughts"
            }`,
            detail: contentSummary(marker.posts),
          });
      });
      map.current.on("mousemove", "unclustered-point", (event) => {
        setHoverPreview(
          (preview) =>
            preview && { ...preview, x: event.point.x, y: event.point.y },
        );
      });
      map.current.on("mouseleave", "unclustered-point", () => {
        setCursor("pointer");
        setHoverPreview(null);
      });
    });

    // Right-click → add pin (mobile/tablet only, desktop uses navbar modal)
    map.current.on("contextmenu", (e) => {
      e.preventDefault();
      if (window.innerWidth >= 1024) return;

      onMarkerAddRef.current({
        id: crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
        lat: e.lngLat.lat,
        lng: e.lngLat.lng,
        posts: [],
      });
    });

    return () => {
      map.current?.off("moveend", reportViewport);
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
      const mlMarker = new MLMarker({
        element: createPinMarkerElement(pin.posts.length),
        anchor: "bottom",
      })
        .setLngLat([pin.lng, pin.lat])
        .addTo(map.current);
      mlMarker.getElement().style.cursor = "pointer";
      mlMarker.getElement().addEventListener("click", (e) => {
        e.stopPropagation();
        setHoverPreview(null);
        onMarkerSelectRef.current(pin.id);
      });
      mlMarker.getElement().addEventListener("mouseenter", () => {
        const point = map.current?.project([pin.lng, pin.lat]);
        if (point)
          setHoverPreview({
            x: point.x,
            y: point.y,
            title: `${pin.posts.length} ${
              pin.posts.length === 1 ? "thought" : "thoughts"
            }`,
            detail: contentSummary(pin.posts),
          });
      });
      mlMarker
        .getElement()
        .addEventListener("mouseleave", () => setHoverPreview(null));
      searchMarkersRef.current.set(pin.id, mlMarker);
    }
  }, [markers]);

  // Fly to a location when the flyTo prop changes
  useEffect(() => {
    if (!flyTo || !map.current) return;
    const compact = window.innerWidth < 640;
    const options: Parameters<typeof map.current.flyTo>[0] = {
      center: [flyTo.lng, flyTo.lat],
      zoom: flyTo.zoom ?? 15,
      speed: 1.4,
      curve: 1.5,
    };
    if (flyTo.frameRightPanel) {
      options.padding = {
        top: compact ? 12 : 24,
        bottom: compact ? 300 : 24,
        left: compact ? 10 : 24,
        right: compact ? 10 : 460,
      };
    }
    map.current.flyTo(options);
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
        // ponytail: vibrate on successful hold to confirm pin placement
        navigator.vibrate?.(50);
        const lngLat = map.current.unproject([relX, relY]);
        onMarkerAddRef.current({
          id: crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
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
        @keyframes sonder-pin-hover {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-5px) scale(1.08); }
        }
        .sonder-pin-marker { transition: transform 150ms ease; transform-origin: 50% 100%; }
        .sonder-pin-marker:hover { animation: sonder-pin-hover 700ms ease-in-out infinite; }
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
      <AnimatePresence>
        {selectedMarkerId &&
          previewPosition &&
          markers.some((marker) => marker.id === selectedMarkerId) && (
            <MapPostPreview
              key={selectedMarkerId}
              marker={markers.find((marker) => marker.id === selectedMarkerId)!}
              position={previewPosition}
              onClose={() => onMarkerSelect(null)}
              onCreatePost={onCreatePost}
              onViewGroup={onViewGroup}
              onSelectPost={onSelectPost}
            />
          )}
      </AnimatePresence>
      {hoverPreview && (
        <div
          className="pointer-events-none absolute z-40 min-w-32 rounded-lg border border-white/70 bg-background/95 px-3 py-2 text-xs shadow-xl backdrop-blur"
          style={{
            left: hoverPreview.x,
            top: hoverPreview.y,
            transform: "translate(-50%, calc(-100% - 36px))",
          }}
        >
          <p className="font-semibold text-foreground">{hoverPreview.title}</p>
          <p className="mt-0.5 text-muted-foreground">{hoverPreview.detail}</p>
        </div>
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
            <MapPin
              size={24}
              fill="var(--primary)"
              strokeWidth={1.5}
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
