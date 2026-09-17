"use client";

import { memo, useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { MapPin } from "lucide-react";
import {
  Map,
  GeoJSONSource,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  addPinMarkerImage,
} from "@/features/map/lib/map-markers";
import { MapPostPreview } from "./MapPostPreview";
import type { MarkerData } from "@/features/posts/lib/post-types";
import { getOpenFreeMapStyle } from "@/features/map/lib/openfreemap";
import { AppLoading } from "@/components/shared/AppLoading";
import { getLatestPost } from "@/features/posts/lib/post-utils";

export type MapActions = {
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToOverview: () => void;
  toggle3D: () => boolean;
  resetNorth: () => void;
  getPitch: () => number;
  project?: (coords: { lat: number; lng: number }) => { x: number; y: number } | null;
};

type FlyToTarget = {
  lat: number;
  lng: number;
  zoom?: number;
  frameRightPanel?: boolean;
  panelSide?: 'left' | 'right';
} | null;
export type MapViewport = {
  center: { lat: number; lng: number };
  bounds: { north: number; south: number; east: number; west: number };
  zoom?: number;
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
  onMapReady?: (actions: MapActions) => void;
};

type HoverPreview = {
  x: number;
  y: number;
  title: string;
  placement?: "top" | "bottom";
} | null;

function contentSummary(posts: MarkerData["posts"]) {
  const types = new Set<string>();
  for (const post of posts) {
    if (post.imageUrl || post.imagePath) types.add("Photos");
    if (post.music) types.add("Songs");
    if (!post.imageUrl && !post.imagePath && !post.music) types.add("Text");
  }
  return types.size ? [...types].join(" + ") : "Text";
}

function getMarkerHoverPreview(marker: MarkerData): { title: string } {
  const latestPost = getLatestPost(marker.posts);
  if (latestPost) {
    return { title: latestPost.title.trim() || "Untitled thought" };
  }

  return {
    title: marker.placeName || "New pin",
  };
}

function MapCanvas({
  markers,
  selectedMarkerId,
  onMarkerAdd,
  onMarkerSelect,
  onCreatePost,
  onViewGroup,
  onSelectPost,
  onViewportChange,
  flyTo,
  onMapReady,
}: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const onMarkerSelectRef = useRef(onMarkerSelect);
  const onMarkerAddRef = useRef(onMarkerAdd);
  const onViewportChangeRef = useRef(onViewportChange);
  const onMapReadyRef = useRef(onMapReady);
  onMapReadyRef.current = onMapReady;
  const markersRef = useRef<MarkerData[]>(markers);

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
  const hoveredKeyRef = useRef<string | null>(null);
  const selectedMarkerIdRef = useRef<string | null>(selectedMarkerId);
  selectedMarkerIdRef.current = selectedMarkerId;

  onMarkerSelectRef.current = onMarkerSelect;
  onMarkerAddRef.current = onMarkerAdd;
  onViewportChangeRef.current = onViewportChange;
  markersRef.current = markers;

  useEffect(() => {
    if (selectedMarkerId) {
      hoveredKeyRef.current = null;
      setHoverPreview(null);
    }
  }, [selectedMarkerId]);

  const buildGeoJSON = (items: MarkerData[]): GeoJSON.FeatureCollection => ({
    type: "FeatureCollection",
    features: items
      .filter((m) => m.posts.length > 0 || m.source === "manual" || m.source === "search")
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

    const styleUrl = getOpenFreeMapStyle();

    map.current = new Map({
      container: mapContainer.current,
      style: styleUrl,
      center: [lng, lat],
      zoom: zoom,
      pitch: 50,
      fadeDuration: 0,
      renderWorldCopies: false,
      maxTileCacheSize: 100,
      trackResize: true,
      attributionControl: false,
    });

    const canvas = map.current.getCanvas();

    if (onMapReadyRef.current) {
      onMapReadyRef.current({
        zoomIn: () => map.current?.zoomIn({ duration: 250 }),
        zoomOut: () => map.current?.zoomOut({ duration: 250 }),
        zoomToOverview: () => {
          if (!map.current) return;
          // Stop any in-flight flyTo/easeTo so it doesn't re-center to old coordinates
          map.current.stop();
          const currentZoom = map.current.getZoom();
          const targetZoom = currentZoom > 13.5 ? 12.5 : Math.max(currentZoom - 3, 2);
          // Only change zoom — don't touch center or padding to avoid
          // MapLibre recomputing the padded viewport (which causes drift)
          map.current.easeTo({
            zoom: targetZoom,
            duration: 600,
          });
        },
        toggle3D: () => {
          if (!map.current) return false;
          const currentPitch = map.current.getPitch();
          const targetPitch = currentPitch > 15 ? 0 : 50;
          map.current.easeTo({ pitch: targetPitch, duration: 400 });
          return targetPitch > 0;
        },
        resetNorth: () => map.current?.easeTo({ bearing: 0, duration: 300 }),
        getPitch: () => map.current?.getPitch() ?? 0,
        project: (coords) => {
          if (!map.current) return null;
          const pt = map.current.project([coords.lng, coords.lat]);
          return { x: pt.x, y: pt.y };
        },
      });
    }

    map.current.on("styleimagemissing", (event) => {
      if (event.id === "sonder-map-pin" && map.current)
        void addPinMarkerImage(map.current);
    });

    const reportViewport = () => {
      if (!map.current) return;
      const center = map.current.getCenter();
      const bounds = map.current.getBounds();
      const currentZoom = map.current.getZoom();
      onViewportChangeRef.current?.({
        center: { lat: center.lat, lng: center.lng },
        bounds: {
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        },
        zoom: currentZoom,
      });
    };
    map.current.on("moveend", reportViewport);
    map.current.on("zoomend", reportViewport);

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
        clusterRadius: 20,
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

      const clearHover = () => {
        if (hoveredKeyRef.current !== null) {
          hoveredKeyRef.current = null;
          setHoverPreview(null);
        }
        if (map.current) {
          map.current.getCanvas().style.cursor = "";
        }
      };

      // Click cluster → zoom in
      const onClusterClick = (e: maplibregl.MapMouseEvent) => {
        clearHover();
        const features = map.current!.queryRenderedFeatures(e.point, {
          layers: ["clusters", "cluster-count"],
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
          })
          .catch(() => {
            const coords = geometry.coordinates as [number, number];
            map.current!.easeTo({ center: coords, zoom: map.current!.getZoom() + 2 });
          });
      };
      map.current.on("click", "clusters", onClusterClick);
      map.current.on("click", "cluster-count", onClusterClick);

      // Click individual pin → open sidebar
      const onPointClick = (e: maplibregl.MapMouseEvent) => {
        const features = map.current!.queryRenderedFeatures(e.point, {
          layers: ["unclustered-point", "unclustered-count"],
        });
        const id = features[0]?.properties?.id as string | undefined;
        if (id) {
          clearHover();
          onMarkerSelectRef.current(id);
        }
      };
      map.current.on("click", "unclustered-point", onPointClick);
      map.current.on("click", "unclustered-count", onPointClick);

      // Click empty map space → dismiss selected pin and search
      map.current.on("click", (e) => {
        if (!map.current) return;
        const features = map.current.queryRenderedFeatures(e.point, {
          layers: [
            "unclustered-point",
            "unclustered-count",
            "clusters",
            "cluster-count",
          ].filter((layerId) => map.current?.getLayer(layerId)),
        });
        if (features.length > 0) return;

        clearHover();
        onMarkerSelectRef.current(null);
      });

      // Unified hover & cursor tracking across all pins and clusters
      map.current.on("mousemove", async (event) => {
        if (!map.current) return;

        const interactiveLayers = [
          "unclustered-point",
          "unclustered-count",
          "clusters",
          "cluster-count",
        ].filter((layerId) => map.current?.getLayer(layerId));

        if (!interactiveLayers.length) {
          clearHover();
          return;
        }

        const features = map.current.queryRenderedFeatures(event.point, {
          layers: interactiveLayers,
        });

        if (!features.length || !features[0]) {
          clearHover();
          return;
        }

        const feature = features[0];
        map.current.getCanvas().style.cursor = "pointer";

        const isCluster =
          Boolean(feature.properties?.point_count) ||
          feature.layer.id === "clusters" ||
          feature.layer.id === "cluster-count";

        if (isCluster) {
          const clusterId = Number(feature.properties?.cluster_id ?? 0);
          const key = `cluster-${clusterId}`;

          if (hoveredKeyRef.current === key) return;
          hoveredKeyRef.current = key;

          const count = Number(feature.properties?.point_count ?? 0);
          const geometry = feature.geometry as GeoJSON.Point | undefined;
          const coords = (geometry?.coordinates as [number, number] | undefined) ?? [
            event.lngLat.lng,
            event.lngLat.lat,
          ];
          const screenPoint = map.current.project(coords);

          if (hoveredKeyRef.current === key) {
            setHoverPreview({
              x: screenPoint.x,
              y: screenPoint.y,
              title: `${count} thoughts nearby`,
              placement: screenPoint.y < 120 ? "bottom" : "top",
            });
          }
          return;
        }

        // Unclustered pin
        const id = feature.properties?.id as string | undefined;
        if (!id) {
          clearHover();
          return;
        }

        if (selectedMarkerIdRef.current === id) {
          clearHover();
          return;
        }

        const key = `pin-${id}`;
        if (hoveredKeyRef.current === key) return;
        hoveredKeyRef.current = key;

        const marker = markersRef.current.find((item) => item.id === id);
        if (!marker) {
          clearHover();
          return;
        }

        const geometry = feature.geometry as GeoJSON.Point | undefined;
        const coords = (geometry?.coordinates as [number, number] | undefined) ?? [
          marker.lng,
          marker.lat,
        ];
        const screenPoint = map.current.project(coords);
        const preview = getMarkerHoverPreview(marker);

        setHoverPreview({
          x: screenPoint.x,
          y: screenPoint.y,
          title: preview.title,
          placement: screenPoint.y < 120 ? "bottom" : "top",
        });
      });

      map.current.on("movestart", clearHover);
      map.current.on("zoomstart", clearHover);
    });

    const onCanvasLeave = () => {
      if (hoveredKeyRef.current !== null) {
        hoveredKeyRef.current = null;
        setHoverPreview(null);
      }
      if (map.current) {
        map.current.getCanvas().style.cursor = "";
      }
    };
    canvas.addEventListener("mouseleave", onCanvasLeave);
    window.addEventListener("blur", onCanvasLeave);

    // Right-click → add pin (mobile only, tablet+ uses navbar)
    map.current.on("contextmenu", (e) => {
      e.preventDefault();
      if (window.innerWidth >= 768) return;

      onMarkerAddRef.current({
        id: crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
        lat: e.lngLat.lat,
        lng: e.lngLat.lng,
        posts: [],
      });
    });

    return () => {
      window.removeEventListener("blur", onCanvasLeave);
      canvas.removeEventListener("mouseleave", onCanvasLeave);
      map.current?.off("moveend", reportViewport);
      map.current?.off("zoomend", reportViewport);
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Keep parent mapActions up to date whenever map is loaded or onMapReady changes
  useEffect(() => {
    if (!map.current || !mapLoaded || !onMapReady) return;
    onMapReady({
      zoomIn: () => map.current?.zoomIn({ duration: 250 }),
      zoomOut: () => map.current?.zoomOut({ duration: 250 }),
      zoomToOverview: () => {
        if (!map.current) return;
        // Stop any in-flight flyTo/easeTo so it doesn't re-center to old coordinates
        map.current.stop();
        const currentZoom = map.current.getZoom();
        const targetZoom = currentZoom > 13.5 ? 12.5 : Math.max(currentZoom - 3, 2);
        // Only change zoom — don't touch center or padding to avoid
        // MapLibre recomputing the padded viewport (which causes drift)
        map.current.easeTo({
          zoom: targetZoom,
          duration: 600,
        });
      },
      toggle3D: () => {
        if (!map.current) return false;
        const currentPitch = map.current.getPitch();
        const targetPitch = currentPitch > 15 ? 0 : 50;
        map.current.easeTo({ pitch: targetPitch, duration: 400 });
        return targetPitch > 0;
      },
      resetNorth: () => map.current?.easeTo({ bearing: 0, duration: 300 }),
      getPitch: () => map.current?.getPitch() ?? 0,
      project: (coords) => {
        if (!map.current) return null;
        const pt = map.current.project([coords.lng, coords.lat]);
        return { x: pt.x, y: pt.y };
      },
    });
  }, [mapLoaded, onMapReady]);

  // Sync manual markers → GeoJSON circle layer
  useEffect(() => {
    if (!map.current) return;
    const source = map.current.getSource("pins") as GeoJSONSource | undefined;
    if (!source) return;
    source.setData(buildGeoJSON(markers));
  }, [markers]);

  // Fly to a location when the flyTo prop changes
  useEffect(() => {
    if (!flyTo || !map.current) return;
    const compact = window.innerWidth < 640;
    const PANEL = 540; // wider desktop panel + comfortable gap
    const options: Parameters<typeof map.current.flyTo>[0] = {
      center: [flyTo.lng, flyTo.lat],
      zoom: flyTo.zoom ?? 17.2,
      speed: 1.4,
      curve: 1.5,
      padding: flyTo.frameRightPanel
        ? {
            top: compact ? 12 : 24,
            bottom: compact ? 300 : 24,
            left: compact ? 10 : 24,
            right: compact ? 10 : 460,
          }
        : flyTo.panelSide === 'left'
        ? { top: 120, bottom: compact ? 380 : 80, left: compact ? 20 : PANEL, right: compact ? 20 : 60 }
        : flyTo.panelSide === 'right'
        ? { top: 120, bottom: compact ? 380 : 80, left: compact ? 20 : 60, right: compact ? 20 : PANEL }
        : { top: compact ? 100 : 220, bottom: compact ? 380 : 80, left: compact ? 20 : 80, right: compact ? 20 : 80 },
    };
    map.current.flyTo(options);
  }, [flyTo]);

  useEffect(() => {
    if (!map.current || !selectedMarkerId) {
      setPreviewPosition(null);
      return;
    }
    const selected = markers.find((marker) => marker.id === selectedMarkerId);
    if (!selected) return;

    let moveRaf: number | null = null;
    const update = () => {
      if (moveRaf !== null) cancelAnimationFrame(moveRaf);
      moveRaf = requestAnimationFrame(() => {
        const point = map.current?.project([selected.lng, selected.lat]);
        if (point) setPreviewPosition({ x: point.x, y: point.y });
        moveRaf = null;
      });
    };
    update();
    map.current.on("move", update);
    return () => {
      if (moveRaf !== null) cancelAnimationFrame(moveRaf);
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
        @keyframes sonder-ring-progress {
          0% { transform: scale(0.72); opacity: 0.35; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes sonder-ring-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.6; }
        }
        .maplibregl-ctrl-attrib { display: none !important; }
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
          className="pointer-events-none absolute z-40 w-fit max-w-[280px] rounded-full border border-black/10 bg-background/95 px-3.5 py-1.5 shadow-lg backdrop-blur-xl dark:border-white/15 sm:max-w-[340px]"
          style={{
            left: hoverPreview.x,
            top: hoverPreview.y,
            transform:
              hoverPreview.placement === "bottom"
                ? "translate(-50%, 14px)"
                : "translate(-50%, calc(-100% - 38px))",
          }}
        >
          <p className="text-sm font-normal leading-normal text-foreground whitespace-nowrap truncate max-w-[250px] sm:max-w-[310px]">
            {hoverPreview.title}
          </p>
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

      {/* Mobile hint — shown on touch-only devices (hidden on tablet+ where click works) */}
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

export default memo(MapCanvas);
