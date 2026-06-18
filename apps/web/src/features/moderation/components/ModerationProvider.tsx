"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { groupMarkersByLocation } from "@/features/posts/lib/post-utils";
import type { MarkerData } from "@/features/posts/lib/post-types";
import { usePosts } from "@/features/posts/client/use-posts";

const STORAGE_KEY = "sonder:moderation-markers";
const MY_POSTS_KEY = "sonder:my-post-ids";

type ModerationContextValue = {
  markers: MarkerData[];
  setMarkers: React.Dispatch<React.SetStateAction<MarkerData[]>>;
  myPostIds: Set<string>;
  trackMyPost: (postId: string) => void;
};

const ModerationContext = createContext<ModerationContextValue | null>(null);

export function ModerationProvider({ children }: { children: ReactNode }) {
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [myPostIds, setMyPostIds] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const { remoteMarkers } = usePosts();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored)
        setMarkers(groupMarkersByLocation(JSON.parse(stored) as MarkerData[]));
      const ids = localStorage.getItem(MY_POSTS_KEY);
      if (ids) setMyPostIds(new Set(JSON.parse(ids) as string[]));
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(markers));
  }, [hydrated, markers]);

  useEffect(() => {
    if (hydrated && myPostIds.size > 0)
      localStorage.setItem(MY_POSTS_KEY, JSON.stringify([...myPostIds]));
  }, [hydrated, myPostIds]);

  const trackMyPost = useCallback((postId: string) => {
    setMyPostIds((prev) => {
      const next = new Set(prev);
      next.add(postId);
      return next;
    });
  }, []);

  useEffect(() => {
    if (remoteMarkers) {
      const remotePostIds = new Set(
        remoteMarkers.flatMap((m) => m.posts.map((p) => p.id)),
      );
      setMarkers((current) =>
        groupMarkersByLocation([
          ...remoteMarkers,
          ...current
            .map((marker) => ({
              ...marker,
              posts: marker.posts.filter(
                (post) =>
                  post.moderationStatus === "pending" &&
                  !remotePostIds.has(post.id),
              ),
            }))
            .filter((marker) => marker.posts.length > 0),
        ]),
      );
    }
  }, [remoteMarkers]);

  return (
    <ModerationContext.Provider value={{ markers, setMarkers, myPostIds, trackMyPost }}>
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
