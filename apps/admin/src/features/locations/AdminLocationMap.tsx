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

const PIN_PATH =
  "M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0";

function addAdminPinImages(map: Map) {
  return Promise.all(
    Object.entries(STATUS_COLORS).flatMap(([status, color]) =>
      [false, true].map((reported) => {
        const id = `admin-map-pin-${status}${reported ? "-reported" : ""}`;
        if (map.hasImage(id)) return Promise.resolve();
        return new Promise<void>((resolve, reject) => {
          const image = new Image(36, 46);
          const stroke = reported ? "#ef4444" : "#ffffff";
          image.onload = () => {
            map.addImage(id, image);
            resolve();
          };
          image.onerror = reject;
          image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path fill="${color}" stroke="${stroke}" stroke-width="${reported ? 3.4 : 2.4}" d="${PIN_PATH}"/></svg>`)}`;
        });
      }),
    ),
  );
}

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
    map.current.on("load", async () => {
      if (!map.current) return;
      await addAdminPinImages(map.current);
      map.current.addSource("admin-posts", {
        type: "geojson",
        data: geojsonRef.current,
        cluster: true,
        clusterRadius: 52,
        clusterMaxZoom: 13,
      });
      map.current.addLayer({
        id: "admin-clusters",
        type: "symbol",
        source: "admin-posts",
        filter: ["has", "point_count"],
        layout: {
          "icon-image": "admin-map-pin-approved",
          "icon-size": ["step", ["get", "point_count"], 0.9, 10, 1, 30, 1.15],
          "icon-anchor": "bottom",
          "icon-allow-overlap": true,
        },
      });
      map.current.addLayer({
        id: "admin-cluster-count",
        type: "symbol",
        source: "admin-posts",
        filter: ["has", "point_count"],
        layout: {
          "text-field": "{point_count_abbreviated}",
          "text-size": 12,
          "text-offset": [0, -1.9],
        },
        paint: { "text-color": "#ffffff" },
      });
      map.current.addLayer({
        id: "admin-points",
        type: "symbol",
        source: "admin-posts",
        filter: ["!", ["has", "point_count"]],
        layout: {
          "icon-image": [
            "concat",
            "admin-map-pin-",
            ["get", "status"],
            ["case", ["get", "reported"], "-reported", ""],
          ],
          "icon-size": ["case", ["get", "reported"], 1.08, 0.95],
          "icon-anchor": "bottom",
          "icon-allow-overlap": true,
        },
      });
      map.current.on("click", "admin-points", (event) => {
        const id = event.features?.[0]?.properties?.id as string | undefined;
        if (id) onSelectRef.current(id);
      });
      map.current.on("click", "admin-clusters", (event) => {
        const feature = event.features?.[0];
        const clusterId = feature?.properties?.cluster_id as number | undefined;
        const coordinates = (feature?.geometry as GeoJSON.Point | undefined)
          ?.coordinates as [number, number] | undefined;
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
    (
      map.current?.getSource("admin-posts") as GeoJSONSource | undefined
    )?.setData(geojson);
  }, [geojson]);

  useEffect(() => {
    if (!selectedId) return;
    const post = posts.find((item) => item.id === selectedId);
    if (post)
      map.current?.flyTo({
        center: [post.lng, post.lat],
        zoom: 15,
        speed: 1.2,
      });
  }, [posts, selectedId]);

  return (
    <div
      ref={container}
      className={`h-full w-full ${compact ? "min-h-56" : "min-h-[420px]"}`}
      aria-label="Admin location review map"
    />
  );
}
