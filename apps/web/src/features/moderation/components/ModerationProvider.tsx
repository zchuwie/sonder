"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { mockMarkers } from "@/features/posts/lib/mock-posts";
import { groupMarkersByLocation } from "@/features/posts/lib/post-utils";
import type { MarkerData } from "@/features/posts/lib/post-types";
import type { ModerationDecision, ModerationQueueItem } from "../types";

const STORAGE_KEY = "sonder:moderation-markers";

type ModerationContextValue = {
  markers: MarkerData[];
  setMarkers: React.Dispatch<React.SetStateAction<MarkerData[]>>;
  pending: ModerationQueueItem[];
  decide: (postId: string, decision: ModerationDecision) => void;
};

const ModerationContext = createContext<ModerationContextValue | null>(null);

export function ModerationProvider({ children }: { children: ReactNode }) {
  const [markers, setMarkers] = useState<MarkerData[]>(() => groupMarkersByLocation(mockMarkers));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setMarkers(groupMarkersByLocation(JSON.parse(stored) as MarkerData[]));
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(markers));
  }, [hydrated, markers]);

  const pending = useMemo(
    () => markers.flatMap((marker) => marker.posts.filter((post) => post.moderationStatus === "pending").map((post) => ({ marker, post }))),
    [markers],
  );

  const decide = (postId: string, decision: ModerationDecision) => {
    setMarkers((current) => current.map((marker) => ({
      ...marker,
      posts: marker.posts.map((post) => post.id === postId ? { ...post, moderationStatus: decision === "approve" ? "visible" : "hidden" } : post),
    })));
  };

  return <ModerationContext.Provider value={{ markers, setMarkers, pending, decide }}>{children}</ModerationContext.Provider>;
}

export function useModeration() {
  const value = useContext(ModerationContext);
  if (!value) throw new Error("useModeration must be used within ModerationProvider");
  return value;
}
