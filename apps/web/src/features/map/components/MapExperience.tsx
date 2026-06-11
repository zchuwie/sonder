"use client";

import { useMemo, useState } from "react";
import { Compass, LocateFixed, MapPin, Plus, Sparkles, X } from "lucide-react";
import MapCanvas from "./MapCanvas";
import CreatePostModal from "@/features/posts/components/CreatePostModal";
import PostDetailModal from "@/features/posts/components/PostDetailModal";
import { PostDiscoveryModal } from "@/features/posts/components/PostDiscoveryModal";
import { GroupedPostsModal } from "@/features/posts/components/GroupedPostsModal";
import { PostClusterList } from "@/features/posts/components/PostClusterList";
import { Button } from "@/components/ui/button";
import { MapSearchBar } from "@/features/map/components/MapSearchBar";
import { ThemeSettingsMenu } from "@/components/shared/ThemeSettingsMenu";
import {
  createPost,
  getLocationGroupKey,
  getPublicMarkers,
  getVisiblePosts,
  groupMarkersByLocation,
  removeEmptyMarkers,
} from "@/features/posts/lib/post-utils";
import type {
  AnonymousPost,
  MarkerData,
  PostDraft,
} from "@/features/posts/lib/post-types";
import type { LocationPlaceDTO } from "@/features/map/lib/location-types";
import { useModeration } from "@/features/moderation/components/ModerationProvider";

type FlyToTarget = { lat: number; lng: number; zoom?: number } | null;

export function MapExperience() {
  const { markers, setMarkers } = useModeration();
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<AnonymousPost | null>(null);
  const [flyTo, setFlyTo] = useState<FlyToTarget>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [discoveryOpen, setDiscoveryOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const selectedMarker =
    markers.find((marker) => marker.id === selectedMarkerId) ?? null;
  const publicMarkers = useMemo(() => getPublicMarkers(markers), [markers]);
  const visiblePosts = useMemo(() => getVisiblePosts(markers), [markers]);
  const mapMarkers =
    selectedMarker && selectedMarker.posts.length === 0
      ? [...publicMarkers, selectedMarker]
      : publicMarkers;
  const publicSelectedMarker =
    publicMarkers.find((marker) => marker.id === selectedMarkerId) ?? null;

  const addMarker = (marker: MarkerData) => {
    const cleaned = removeEmptyMarkers(markers);
    const existing = cleaned.find(
      (item) =>
        getLocationGroupKey(item.lat, item.lng) ===
        getLocationGroupKey(marker.lat, marker.lng),
    );
    setMarkers(
      groupMarkersByLocation([...cleaned, { ...marker, source: "manual" }]),
    );
    setSelectedMarkerId(existing?.id ?? marker.id);
  };

  const selectPlace = (place: LocationPlaceDTO) => {
    setFlyTo({ lat: place.lat, lng: place.lng, zoom: 15 });
    const cleaned = removeEmptyMarkers(markers);
    const existing = cleaned.find(
      (marker) =>
        getLocationGroupKey(marker.lat, marker.lng) ===
        getLocationGroupKey(place.lat, place.lng),
    );
    setMarkers(
      existing
        ? cleaned
        : [
            ...cleaned,
            {
              id: place.id,
              lat: place.lat,
              lng: place.lng,
              placeName: place.name,
              posts: [],
              source: "search",
            },
          ],
    );
    setSelectedMarkerId(existing?.id ?? place.id);
  };

  const addPost = (draft: PostDraft) => {
    if (!selectedMarker) return;
    const post = createPost(selectedMarker, draft);
    setMarkers((current) =>
      groupMarkersByLocation(
        current.map((marker) =>
          marker.id === selectedMarker.id
            ? { ...marker, posts: [...marker.posts, post] }
            : marker,
        ),
      ),
    );
    setSelectedMarkerId(null);
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setMarkers((current) => removeEmptyMarkers(current));
    if (selectedMarker?.posts.length === 0) setSelectedMarkerId(null);
  };

  const locate = () =>
    navigator.geolocation?.getCurrentPosition(({ coords }) =>
      setFlyTo({ lat: coords.latitude, lng: coords.longitude, zoom: 15 }),
    );

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-muted">
      <MapCanvas
        markers={mapMarkers}
        selectedMarkerId={selectedMarkerId}
        onMarkerAdd={addMarker}
        onMarkerSelect={setSelectedMarkerId}
        onCreatePost={() => setCreateOpen(true)}
        onViewGroup={() => setGroupOpen(true)}
        flyTo={flyTo}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-start justify-between gap-3 p-3 sm:p-5">
        <div className="pointer-events-auto flex min-w-0 flex-1 items-center gap-2 sm:max-w-xl">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-white/70 bg-background/95 text-primary shadow-lg backdrop-blur-xl">
            <Compass className="size-5" />
          </div>
          <MapSearchBar onPlaceSelect={selectPlace} />
        </div>
        <div className="pointer-events-auto flex gap-2">
          <ThemeSettingsMenu />
          <Button
            variant="secondary"
            size="icon"
            className="size-11 rounded-2xl border border-white/70 bg-background/95 shadow-lg backdrop-blur-xl"
            onClick={locate}
            aria-label="Use my location"
          >
            <LocateFixed />
          </Button>
        </div>
      </div>
      <div className="absolute bottom-14 right-5 z-30 hidden sm:block">
        <Button
          variant="secondary"
          className="h-11 rounded-2xl border border-white/70 bg-background/95 px-4 shadow-lg backdrop-blur-xl"
          onClick={() => setDiscoveryOpen(true)}
        >
          <Sparkles /> Explore nearby{" "}
          <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] text-primary-foreground">
            {visiblePosts.length}
          </span>
        </Button>
      </div>
      <div className="absolute inset-x-3 bottom-3 z-30 sm:hidden">
        {selectedMarker ? (
          <div className="rounded-3xl border bg-background/95 p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MapPin className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {selectedMarker.placeName ?? "Selected place"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {publicSelectedMarker
                    ? `${publicSelectedMarker.posts.length} thoughts pinned here`
                    : "Leave a thought to create this pin."}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setSelectedMarkerId(null)}
              >
                <X />
              </Button>
            </div>
            {publicSelectedMarker && (
              <div className="mt-3">
                <PostClusterList
                  posts={publicSelectedMarker.posts}
                  limit={2}
                  onSelect={() => setGroupOpen(true)}
                />
              </div>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setCreateOpen(true)}
              >
                <Plus /> Leave thought
              </Button>
              <Button
                className="rounded-xl"
                onClick={() => setGroupOpen(true)}
                disabled={!publicSelectedMarker}
              >
                View details
              </Button>
            </div>
          </div>
        ) : (
          <Button
            className="h-12 w-full rounded-2xl shadow-xl"
            onClick={() => setDiscoveryOpen(true)}
          >
            <Sparkles /> Explore nearby thoughts
          </Button>
        )}
      </div>
      <PostDiscoveryModal
        open={discoveryOpen}
        posts={visiblePosts}
        onOpenChange={setDiscoveryOpen}
        onSelectPost={(post) => {
          setSelectedPost(post);
          setDiscoveryOpen(false);
        }}
      />
      <GroupedPostsModal
        marker={publicSelectedMarker}
        open={groupOpen}
        onOpenChange={setGroupOpen}
        onSelectPost={(post) => {
          setGroupOpen(false);
          setSelectedPost(post);
        }}
      />
      {createOpen && selectedMarker && (
        <CreatePostModal
          marker={selectedMarker}
          onClose={closeCreate}
          onSubmit={addPost}
        />
      )}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </main>
  );
}
