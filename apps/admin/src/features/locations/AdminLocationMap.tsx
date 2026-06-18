"use client";

import { useEffect, useMemo, useRef } from "react";
import { GeoJSONSource, Map, NavigationControl } from "maplibre-gl";
import { getOpenFreeMapStyle } from "@repo/map-config";
import type { PostRow } from "@/features/moderation/types";

const STATUS_COLORS: Record<PostRow["status"], string> = {
  pending: "#d97706",
  approved: "#197a36",
  rejected: "#b42318",
  flagged: "#dc2626",
  archived: "#475569",
};

export function AdminLocationMap({
  posts,
  selectedId,
  reportCounts,
  onSelect,
  compact = false,
}: {
  posts: PostRow[];
  selectedId: string | null;
  reportCounts: Record<string, number>;
  onSelect: (postId: string) => void;
  compact?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const onSelectRef = useRef(onSelect);
  const geojsonRef = useRef<GeoJSON.FeatureCollection>({
    type: "FeatureCollection",
    features: [],
  });
  onSelectRef.current = onSelect;

  const geojson = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: "FeatureCollection",
      features: posts.map((post) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [post.lng, post.lat] },
        properties: {
          id: post.id,
          status: post.status,
          color: STATUS_COLORS[post.status],
          reported: (reportCounts[post.id] ?? 0) > 0,
        },
      })),
    }),
    [posts, reportCounts],
  );
  geojsonRef.current = geojson;

  useEffect(() => {
    if (!container.current || map.current) return;
    map.current = new Map({
      container: container.current,
      style: getOpenFreeMapStyle("light"),
      center: [120.9842, 14.5995],
      zoom: 10,
    });
    map.current.addControl(new NavigationControl(), "bottom-right");
    map.current.on("load", () => {
      if (!map.current) return;
      map.current.addSource("admin-posts", {
        type: "geojson",
        data: geojsonRef.current,
        cluster: true,
        clusterRadius: 52,
        clusterMaxZoom: 13,
      });
      map.current.addLayer({
        id: "admin-clusters",
        type: "circle",
        source: "admin-posts",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#173f27",
          "circle-radius": ["step", ["get", "point_count"], 16, 10, 20, 30, 25],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 3,
        },
      });
      map.current.addLayer({
        id: "admin-cluster-count",
        type: "symbol",
        source: "admin-posts",
        filter: ["has", "point_count"],
        layout: { "text-field": "{point_count_abbreviated}", "text-size": 12 },
        paint: { "text-color": "#ffffff" },
      });
      map.current.addLayer({
        id: "admin-points",
        type: "circle",
        source: "admin-posts",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": ["case", ["get", "reported"], 11, 8],
          "circle-stroke-color": ["case", ["get", "reported"], "#ef4444", "#ffffff"],
          "circle-stroke-width": ["case", ["get", "reported"], 4, 2],
        },
      });
      map.current.on("click", "admin-points", (event) => {
        const id = event.features?.[0]?.properties?.id as string | undefined;
        if (id) onSelectRef.current(id);
      });
      map.current.on("click", "admin-clusters", (event) => {
        const feature = event.features?.[0];
        const clusterId = feature?.properties?.cluster_id as number | undefined;
        const coordinates = (feature?.geometry as GeoJSON.Point | undefined)?.coordinates as [number, number] | undefined;
        if (clusterId === undefined || !coordinates) return;
        void (map.current?.getSource("admin-posts") as GeoJSONSource)
          .getClusterExpansionZoom(clusterId)
          .then((zoom) => map.current?.easeTo({ center: coordinates, zoom }));
      });
      ["admin-points", "admin-clusters"].forEach((layer) => {
        map.current?.on("mouseenter", layer, () => {
          if (map.current) map.current.getCanvas().style.cursor = "pointer";
        });
        map.current?.on("mouseleave", layer, () => {
          if (map.current) map.current.getCanvas().style.cursor = "";
        });
      });
    });
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    (map.current?.getSource("admin-posts") as GeoJSONSource | undefined)?.setData(geojson);
  }, [geojson]);

  useEffect(() => {
    if (!selectedId) return;
    const post = posts.find((item) => item.id === selectedId);
    if (post) map.current?.flyTo({ center: [post.lng, post.lat], zoom: 15, speed: 1.2 });
  }, [posts, selectedId]);

  return <div ref={container} className={`h-full w-full ${compact ? "min-h-56" : "min-h-[420px]"}`} aria-label="Admin location review map" />;
}
