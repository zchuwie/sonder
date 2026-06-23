"use client";

import { useMemo, useState } from "react";
import {
  Compass,
  LocateFixed,
  MapPin,
  Plus,
  X,
} from "lucide-react";
import MapCanvas, { type MapViewport } from "./MapCanvas";
import CreatePostModal from "@/features/posts/components/CreatePostModal";
import { NavCreatePostModal } from "@/features/posts/components/NavCreatePostModal";
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
  getNearbyVisiblePosts,
  getPublicMarkers,
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
import { createSupabasePost } from "@/features/posts/client/use-create-post";
import { getFunctionErrorMessage } from "@/lib/supabase/function-error";
import { reverseGeocode } from "@/features/map/client/reverse-geocode";
import { useActivityPulse } from "@/features/activity/use-activity-pulse";
import Link from "next/link";

type FlyToTarget = {
  lat: number;
  lng: number;
  zoom?: number;
  frameRightPanel?: boolean;
} | null;
const INITIAL_VIEWPORT: MapViewport = {
  center: { lat: 14.5995, lng: 120.9842 },
  bounds: { north: 14.85, south: 14.35, east: 121.25, west: 120.7 },
};

export function MapExperience() {
  const { markers, setMarkers, trackMyPost, refreshPosts } = useModeration();
  useActivityPulse(refreshPosts);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<AnonymousPost | null>(null);
  const [flyTo, setFlyTo] = useState<FlyToTarget>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [navCreateOpen, setNavCreateOpen] = useState(false);
  const [discoveryOpen, setDiscoveryOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [viewport, setViewport] = useState<MapViewport>(INITIAL_VIEWPORT);
  const selectedMarker =
    markers.find((marker) => marker.id === selectedMarkerId) ?? null;
  const publicMarkers = useMemo(() => getPublicMarkers(markers), [markers]);
  const nearbyPosts = useMemo(
    () => getNearbyVisiblePosts(markers, viewport.center, viewport.bounds),
    [markers, viewport],
  );
  const mapMarkers =
    selectedMarker && selectedMarker.posts.length === 0
      ? [...publicMarkers, selectedMarker]
      : publicMarkers;
  const publicSelectedMarker =
    publicMarkers.find((marker) => marker.id === selectedMarkerId) ?? null;

  const addMarker = async (marker: MarkerData) => {
    const placeName =
      marker.placeName ?? (await reverseGeocode(marker.lat, marker.lng));
    const namedMarker = { ...marker, placeName };
    const cleaned = removeEmptyMarkers(markers);
    const existing = cleaned.find(
      (item) =>
        getLocationGroupKey(item.lat, item.lng) ===
        getLocationGroupKey(namedMarker.lat, namedMarker.lng),
    );
    setMarkers(
      groupMarkersByLocation([
        ...cleaned,
        { ...namedMarker, source: "manual" },
      ]),
    );
    setSelectedMarkerId(existing?.id ?? namedMarker.id);
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

  const addPost = async (draft: PostDraft) => {
    if (!selectedMarker) throw new Error("Select a location first.");
    let result;
    try {
      result = await createSupabasePost(selectedMarker, draft);
    } catch (cause) {
      throw new Error(
        await getFunctionErrorMessage(cause, "Unable to submit thought."),
      );
    }
    if (!result) throw new Error("Unable to submit thought.");
    const post = { ...createPost(selectedMarker, draft), id: result.postId };
    trackMyPost(result.postId);
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

  const openPostOnMap = (post: AnonymousPost) => {
    const marker = publicMarkers.find((item) =>
      item.posts.some((markerPost) => markerPost.id === post.id),
    );
    setSelectedMarkerId(marker?.id ?? null);
    setFlyTo({
      lat: marker?.lat ?? post.lat,
      lng: marker?.lng ?? post.lng,
      zoom: 15,
      frameRightPanel: true,
    });
    window.setTimeout(() => setSelectedPost(post), 250);
  };

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-muted">
      <MapCanvas
        markers={mapMarkers}
        selectedMarkerId={selectedPost || groupOpen ? null : selectedMarkerId}
        onMarkerAdd={addMarker}
        onMarkerSelect={(id) => {
          if (!id) { setSelectedMarkerId(null); return; }
          // Desktop: skip popup for pins with posts
          if (window.innerWidth >= 1024) {
            const marker = publicMarkers.find((m) => m.id === id);
            if (marker && marker.posts.length === 1) {
              setSelectedPost(marker.posts[0]!);
              return;
            }
            if (marker && marker.posts.length > 1) {
              setSelectedMarkerId(id);
              setGroupOpen(true);
              return;
            }
          }
          setSelectedMarkerId(id);
        }}
        onCreatePost={() => setCreateOpen(true)}
        onViewGroup={() => setGroupOpen(true)}
        onSelectPost={(post) => { setSelectedMarkerId(null); setSelectedPost(post); }}
        onViewportChange={setViewport}
        flyTo={flyTo}
      />
      {/* Desktop navbar — unified top bar (lg+ only) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 hidden p-4 lg:block">
        <nav className="pointer-events-auto mx-auto flex max-w-7xl items-center gap-3 rounded-full border border-black/10 bg-background/95 px-4 py-2.5 shadow-2xl shadow-black/10 backdrop-blur-xl">
          <a href="/" className="flex size-10 shrink-0 items-center justify-center rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/sonder-logo.png" alt="Sonder" className="size-7 rounded-full object-cover" />
          </a>
          <div className="min-w-0 flex-1">
            <MapSearchBar onPlaceSelect={selectPlace} center={viewport.center} />
          </div>
          <ThemeSettingsMenu />
          <Button
            variant="secondary"
            size="icon"
            className="size-10 rounded-full border border-black/10"
            onClick={locate}
            aria-label="Use my location"
          >
            <LocateFixed className="size-4" />
          </Button>
          <Button
            className="rounded-full px-5"
            onClick={() => setNavCreateOpen(true)}
          >
            <Plus className="size-4" /> Create a post
          </Button>
        </nav>
      </div>

      {/* Mobile floating controls (below lg) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 p-2.5 lg:hidden">
        <div className="pointer-events-auto flex min-w-0 items-center gap-2 pr-13 sm:max-w-xl sm:pr-0">
          <Link href="/" className="flex size-10 shrink-0 items-center justify-center rounded-xl">
            <img src="/brand/sonder-logo.png" alt="Sonder" className="size-7 rounded-full object-cover" />
          </Link>
          <MapSearchBar onPlaceSelect={selectPlace} center={viewport.center} />
        </div>
        <div className="pointer-events-none absolute right-2.5 top-2.5 z-40 flex flex-col items-end gap-2 sm:right-5 sm:top-5 sm:gap-3">
          <div className="pointer-events-auto">
            <ThemeSettingsMenu />
          </div>
          <div className="pointer-events-auto">
            <Button
              variant="secondary"
              size="icon"
              className="size-11 rounded-full border border-black/10 bg-background/95 shadow-lg backdrop-blur-md transition-[transform,background-color,box-shadow] duration-200 hover:scale-[1.03] hover:bg-background hover:shadow-xl"
              onClick={locate}
              aria-label="Use my location"
            >
              <LocateFixed />
            </Button>
          </div>
        </div>
      </div>
      <div className="absolute bottom-16 right-5 z-30 hidden space-y-2 sm:block">
        <Button
          variant="secondary"
          className="h-11 rounded-2xl border border-black/10 bg-background/95 px-4 shadow-lg backdrop-blur-xl transition-[transform,box-shadow,background-color] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-xl"
          onClick={() => setDiscoveryOpen(true)}
        >
          <Compass /> Explore nearby{" "}
          <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] text-primary-foreground">
            {nearbyPosts.length}
          </span>
        </Button>
      </div>
      <div className="absolute inset-x-2.5 bottom-0 z-30 pb-[max(.625rem,env(safe-area-inset-bottom))] sm:hidden">
        {selectedMarker && !selectedPost ? (
          <div className="rounded-2xl border border-black/10 bg-background/95 p-3 shadow-2xl backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MapPin className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {selectedMarker.placeName ?? "Selected place"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {publicSelectedMarker && publicSelectedMarker.posts.length > 0
                    ? `${publicSelectedMarker.posts.length} thoughts pinned here`
                    : "No thoughts here yet."}
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
            {publicSelectedMarker && publicSelectedMarker.posts.length === 1 && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button variant="outline" className="rounded-xl" onClick={() => setCreateOpen(true)}>
                  <Plus /> Add thought
                </Button>
                <Button className="rounded-xl" onClick={() => { setSelectedPost(publicSelectedMarker.posts[0]!); setSelectedMarkerId(null); }}>
                  View thought
                </Button>
              </div>
            )}
            {publicSelectedMarker && publicSelectedMarker.posts.length > 1 && (
              <>
                <div className="mt-3">
                  <PostClusterList posts={publicSelectedMarker.posts} limit={2} onSelect={(post) => { setSelectedPost(post); setSelectedMarkerId(null); }} />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Button variant="outline" className="rounded-xl" onClick={() => setCreateOpen(true)}>
                    <Plus /> Add thought
                  </Button>
                  <Button className="rounded-xl" onClick={() => setGroupOpen(true)}>
                    View all
                  </Button>
                </div>
              </>
            )}
            {(!publicSelectedMarker || publicSelectedMarker.posts.length === 0) && (
              <Button className="mt-3 w-full rounded-xl" onClick={() => setCreateOpen(true)}>
                <Plus /> Create a post
              </Button>
            )}
          </div>
        ) : (
          <div className="flex justify-end">
            <Button
              size="icon"
              className="size-12 rounded-full shadow-xl"
              onClick={() => setDiscoveryOpen(true)}
            >
              <Compass />
            </Button>
          </div>
        )}
      </div>
      <PostDiscoveryModal
        open={discoveryOpen}
        posts={nearbyPosts}
        onOpenChange={setDiscoveryOpen}
        onSelectPost={(post) => {
          setDiscoveryOpen(false);
          openPostOnMap(post);
        }}
      />
      <GroupedPostsModal
        marker={publicSelectedMarker}
        open={groupOpen}
        onOpenChange={setGroupOpen}
        onSelectPost={(post) => {
          setGroupOpen(false);
          openPostOnMap(post);
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
      {navCreateOpen && (
        <NavCreatePostModal
          onClose={() => setNavCreateOpen(false)}
          onSubmit={async (marker, draft) => {
            // Use same logic as addPost but with the provided marker
            const result = await createSupabasePost(marker, draft);
            if (!result) throw new Error("Unable to submit thought.");
            const post = { ...createPost(marker, draft), id: result.postId };
            trackMyPost(result.postId);
            setMarkers((current) =>
              groupMarkersByLocation([
                ...current,
                { ...marker, posts: [post] },
              ]),
            );
          }}
        />
      )}
    </main>
  );
}
