"use client";

import { useEffect, useRef, useState } from "react";
import { Map, NavigationControl, GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { type MarkerData } from "./CustomPopup";

type Mode = "grab" | "mark";

const PIN_COLOR = "#137818"; 

type Props = {
  markers: MarkerData[];
  selectedMarkerId: string | null;
  onMarkerAdd: (marker: MarkerData) => void;
  onMarkerSelect: (id: string | null) => void;
};

export default function MapContainer({
  markers,
  onMarkerAdd,
  onMarkerSelect,
}: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const modeRef = useRef<Mode>("grab");
  const onMarkerSelectRef = useRef(onMarkerSelect);
  const onMarkerAddRef = useRef(onMarkerAdd);
  const markersRef = useRef<MarkerData[]>(markers);

  const lng = 120.9842;
  const lat = 14.5995;
  const zoom = 12;
  const [mode, setMode] = useState<Mode>("grab");

  onMarkerSelectRef.current = onMarkerSelect;
  onMarkerAddRef.current = onMarkerAdd;
  markersRef.current = markers;

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const buildGeoJSON = (items: MarkerData[]): GeoJSON.FeatureCollection => ({
    type: "FeatureCollection",
    features: items.map((m) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [m.lng, m.lat] },
      properties: { id: m.id },
    })),
  });

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new Map({
      container: mapContainer.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [lng, lat],
      zoom: zoom,
    });

    map.current.doubleClickZoom.disable();

    map.current.addControl(new NavigationControl());

    // GeoJSON
    map.current.on("load", () => {
      if (!map.current) return;

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

      // Individual pin
      map.current.addLayer({
        id: "unclustered-point",
        type: "circle",
        source: "pins",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": PIN_COLOR,
          "circle-radius": 7,
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
        setCursor(modeRef.current === "mark" ? "crosshair" : "grab"),
      );
      map.current.on("mouseenter", "unclustered-point", () =>
        setCursor("pointer"),
      );
      map.current.on("mouseleave", "unclustered-point", () =>
        setCursor(modeRef.current === "mark" ? "crosshair" : "grab"),
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

  // Sync React markers state → MapLibre GeoJSON source
  useEffect(() => {
    if (!map.current) return;
    const source = map.current.getSource("pins") as GeoJSONSource | undefined;
    if (!source) return;
    source.setData(buildGeoJSON(markers));
  }, [markers]);

  useEffect(() => {
    if (!map.current) return;

    const canvas = map.current.getCanvas();
    canvas.style.cursor = mode === "mark" ? "crosshair" : "grab";
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

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        <button
          onClick={() => setMode("grab")}
          className={`px-4 py-2 rounded-full text-sm font-medium shadow transition-colors ${
            mode === "grab"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          ✋ Grab (G)
        </button>
        <button
          onClick={() => setMode("mark")}
          className={`px-4 py-2 rounded-full text-sm font-medium shadow transition-colors ${
            mode === "mark"
              ? "bg-red-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          📍 Mark (M)
        </button>
      </div>
    </div>
  );
}
