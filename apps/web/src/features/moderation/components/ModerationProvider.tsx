"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { mockMarkers } from "@/features/posts/lib/mock-posts";
import { groupMarkersByLocation } from "@/features/posts/lib/post-utils";
import type { MarkerData } from "@/features/posts/lib/post-types";
import { usePosts } from "@/features/posts/client/use-posts";

const STORAGE_KEY = "sonder:moderation-markers";

type ModerationContextValue = {
  markers: MarkerData[];
  setMarkers: React.Dispatch<React.SetStateAction<MarkerData[]>>;
};

const ModerationContext = createContext<ModerationContextValue | null>(null);

export function ModerationProvider({ children }: { children: ReactNode }) {
  const [markers, setMarkers] = useState<MarkerData[]>(() =>
    groupMarkersByLocation(mockMarkers),
  );
  const [hydrated, setHydrated] = useState(false);
  const { remoteMarkers } = usePosts();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored)
        setMarkers(groupMarkersByLocation(JSON.parse(stored) as MarkerData[]));
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(markers));
  }, [hydrated, markers]);

  useEffect(() => {
    if (remoteMarkers) setMarkers(groupMarkersByLocation(remoteMarkers));
  }, [remoteMarkers]);

  return (
    <ModerationContext.Provider value={{ markers, setMarkers }}>
      {children}
    </ModerationContext.Provider>
  );
}

export function useModeration() {
  const value = useContext(ModerationContext);
  if (!value)
    throw new Error("useModeration must be used within ModerationProvider");
  return value;
}
