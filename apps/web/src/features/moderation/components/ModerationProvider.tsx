"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
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
  const [markers, setMarkers] = useState<MarkerData[]>([]);
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
    if (remoteMarkers)
      setMarkers((current) =>
        groupMarkersByLocation([
          ...remoteMarkers,
          ...current
            .map((marker) => ({
              ...marker,
              posts: marker.posts.filter(
                (post) => post.moderationStatus === "pending",
              ),
            }))
            .filter((marker) => marker.posts.length > 0),
        ]),
      );
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
