"use client";

import { useEffect, useRef, useState } from "react";
import {
  AttributionControl,
  Map,
  Marker,
  NavigationControl,
} from "maplibre-gl";
import { useTheme } from "next-themes";
import { AppLoading } from "@/components/shared/AppLoading";
import { getOpenFreeMapStyle } from "@/features/map/lib/openfreemap";
import type { AnonymousPost } from "@/features/posts/lib/post-types";

export function SharedPostMap({ post }: { post: AnonymousPost }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const marker = useRef<Marker | null>(null);
  const [loaded, setLoaded] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!container.current || map.current) return;
    const mapContainer = container.current;
    const instance = new Map({
      container: mapContainer,
      style: getOpenFreeMapStyle(resolvedTheme),
      center: [post.lng, post.lat],
      zoom: 14.5,
      attributionControl: false,
    });
    map.current = instance;
    instance.addControl(new NavigationControl(), "bottom-left");
    instance.addControl(new AttributionControl({ compact: true }), "bottom-left");

    const framePost = () => {
      const panel = document.querySelector<HTMLElement>(
        "[data-shared-post-panel]",
      );
      const panelWidth = panel?.getBoundingClientRect().width ?? 0;
      instance.setPadding({
        top: 24,
        bottom: 24,
        left: 24,
        right: panelWidth + 32,
      });
      instance.easeTo({
        center: [post.lng, post.lat],
        zoom: 14.5,
        duration: 0,
      });
    };

    instance.once("load", () => {
      marker.current = new Marker({ color: "#137818", scale: 1.25 })
        .setLngLat([post.lng, post.lat])
        .addTo(instance);
      setLoaded(true);
      framePost();
    });

    const observer = new ResizeObserver(() => framePost());
    observer.observe(mapContainer);
    const panel = document.querySelector<HTMLElement>(
      "[data-shared-post-panel]",
    );
    if (panel) observer.observe(panel);

    return () => {
      observer.disconnect();
      marker.current?.remove();
      marker.current = null;
      instance.remove();
      map.current = null;
    };
  }, [post.lat, post.lng, resolvedTheme]);

  return (
    <div className="absolute inset-0">
      <div
        ref={container}
        className="size-full"
        aria-label={`Interactive map showing the shared thought at ${post.placeName ?? "its pinned location"}`}
      />
      {!loaded && <AppLoading contained label="Loading shared location..." />}
    </div>
  );
}
