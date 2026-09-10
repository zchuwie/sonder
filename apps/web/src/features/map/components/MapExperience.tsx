"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Compass,
  Plus,
} from "lucide-react";
import MapCanvas, { type MapActions, type MapViewport } from "./MapCanvas";
import { MapFloatingControls } from "./MapFloatingControls";
import { MapPlaceBottomSheet } from "./MapPlaceBottomSheet";
import CreatePostModal from "@/features/posts/components/CreatePostModal";
import { NavCreatePostModal } from "@/features/posts/components/NavCreatePostModal";
import PostDetailModal from "@/features/posts/components/PostDetailModal";
import { PostDiscoveryModal } from "@/features/posts/components/PostDiscoveryModal";
import { GroupedPostsModal } from "@/features/posts/components/GroupedPostsModal";
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
import { useSearchParams } from "next/navigation";

type FlyToTarget = {
  lat: number;
  lng: number;
  zoom?: number;
  frameRightPanel?: boolean;
  panelSide?: 'left' | 'right';
} | null;
const INITIAL_VIEWPORT: MapViewport = {
  center: { lat: 14.5995, lng: 120.9842 },
  bounds: { north: 14.85, south: 14.35, east: 121.25, west: 120.7 },
};

export function MapExperience() {
  const searchParams = useSearchParams();
  const { markers, setMarkers, trackMyPost, refreshPosts, onViewportChange: onBoundsChange } = useModeration();
  useActivityPulse(refreshPosts);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<AnonymousPost | null>(null);
  const [panelSide, setPanelSide] = useState<'left' | 'right'>('right');
  const [flyTo, setFlyTo] = useState<FlyToTarget>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [navCreateOpen, setNavCreateOpen] = useState(false);
  const [discoveryOpen, setDiscoveryOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [viewport, setViewport] = useState<MapViewport>(INITIAL_VIEWPORT);
  const [mapActions, setMapActions] = useState<MapActions | null>(null);
  
  const [searchedLocation, setSearchedLocation] = useState<LocationPlaceDTO | null>(null);

  const selectedMarker = markers.find((marker) => marker.id === selectedMarkerId) ?? null;
  const publicMarkers = useMemo(() => getPublicMarkers(markers), [markers]);
  const nearbyPosts = useMemo(
    () => getNearbyVisiblePosts(markers, viewport.center, viewport.bounds),
    [markers, viewport],
  );

  useEffect(() => {
    const postId = searchParams?.get("post");
    if (!postId || publicMarkers.length === 0) return;
    if (selectedPost?.id === postId) return;

    const marker = publicMarkers.find(m => m.posts.some(p => p.id === postId));
    if (marker) {
      const post = marker.posts.find(p => p.id === postId);
      if (post) {
        const side = marker.lng > viewport.center.lng ? 'left' : 'right';
        setPanelSide(side);
        setFlyTo({ lat: marker.lat, lng: marker.lng, zoom: 15, panelSide: side });
        setSelectedPost(post);
        // Remove param from URL without reload so it doesn't trigger again
        window.history.replaceState(null, '', '/map');
      }
    }
  }, [searchParams, publicMarkers, selectedPost, viewport.center.lng]);
  const mapMarkers = useMemo(() => {
    const searchM = markers.filter(m => m.source === "search" && m.posts.length === 0);
    const selectedM = selectedMarker && selectedMarker.posts.length === 0 && selectedMarker.source !== "search" ? [selectedMarker] : [];
    return [...publicMarkers, ...searchM, ...selectedM];
  }, [markers, publicMarkers, selectedMarker]);
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
    setSearchedLocation(place);
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
    setSelectedMarkerId(existing && existing.posts.length > 0 ? existing.id : null);
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

  const openPostOnMap = (post: AnonymousPost) => {
    const marker = publicMarkers.find((item) =>
      item.posts.some((markerPost) => markerPost.id === post.id),
    );
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    if (isMobile && marker) {
      setFlyTo({ lat: marker.lat, lng: marker.lng, zoom: 15.5 });
      setSelectedMarkerId(marker.id);
      return;
    }
    const side = marker && marker.lng > viewport.center.lng ? 'left' : 'right';
    setPanelSide(side);
    setFlyTo({
      lat: marker?.lat ?? post.lat,
      lng: marker?.lng ?? post.lng,
      zoom: 15,
      panelSide: side,
    });
    setSelectedPost(post);
  };

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-muted">
      <MapCanvas
        markers={mapMarkers}
        selectedMarkerId={selectedPost || groupOpen ? null : selectedMarkerId}
        onMarkerAdd={addMarker}
        onMarkerSelect={(id) => {
          if (!id) { setSelectedMarkerId(null); return; }
          const marker = publicMarkers.find((m) => m.id === id);
          const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

          if (isMobile) {
            if (marker) {
              setFlyTo({ lat: marker.lat, lng: marker.lng, zoom: 15.5 });
            }
            setSelectedMarkerId(id);
            return;
          }

          // Desktop logic:
          const side: 'left' | 'right' =
            marker && marker.lng > viewport.center.lng ? 'left' : 'right';
          setPanelSide(side);
          if (marker) setFlyTo({ lat: marker.lat, lng: marker.lng, zoom: 15.5, panelSide: side });
          if (marker && marker.posts.length === 1) {
            setTimeout(() => setSelectedPost(marker.posts[0]!), 350);
            return;
          }
          setSelectedMarkerId(id);
        }}
        onCreatePost={() => setCreateOpen(true)}
        onViewGroup={() => setGroupOpen(true)}
        onSelectPost={(post) => { setSelectedMarkerId(null); setSelectedPost(post); }}
        onViewportChange={(vp) => { setViewport(vp); onBoundsChange(vp.bounds); }}
        flyTo={flyTo}
        onMapReady={setMapActions}
      />
      {/* Desktop navbar — unified top bar (md+) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 hidden p-4 md:block">
        <nav className="pointer-events-auto mx-auto flex max-w-7xl items-center gap-3 rounded-full border border-black/10 bg-background/95 px-4 py-2.5 shadow-2xl shadow-black/10 backdrop-blur-xl">
          <div className="min-w-0 flex-1">
            <MapSearchBar onPlaceSelect={selectPlace} center={viewport.center} />
          </div>
          <ThemeSettingsMenu />

          <Button
            className="rounded-full px-5"
            onClick={() => setNavCreateOpen(true)}
          >
            <Plus className="size-4" /> Create a post
          </Button>
        </nav>
      </div>

      {/* Mobile floating search bar (below md) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 p-2.5 md:hidden">
        <div className="pointer-events-auto">
          <MapSearchBar
            onPlaceSelect={selectPlace}
            center={viewport.center}
          />
        </div>
      </div>

      {/* Right-Side Floating Control Stack (3D, Compass, Zoom, Theme, Nearby) */}
      <div className="absolute right-3 top-20 sm:top-24 z-30 pointer-events-none">
        <MapFloatingControls
          mapActions={mapActions}
          nearbyCount={nearbyPosts.length}
          onNearbyClick={() => setDiscoveryOpen(true)}
        />
      </div>

      {/* Desktop explore nearby button */}
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

      {/* Mobile Place Bottom Sheet (Functional Draggable Drawer) */}
      <MapPlaceBottomSheet
        marker={selectedMarker}
        onClose={() => {
          setSelectedMarkerId(null);
          if (selectedMarker?.posts.length === 0) {
            setMarkers((current) => removeEmptyMarkers(current));
          }
        }}
        onCreatePost={() => setCreateOpen(true)}
      />
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
          panelSide={panelSide}
          onClose={() => setSelectedPost(null)}
        />
      )}
      {navCreateOpen && (
        <NavCreatePostModal
          initialLocation={searchedLocation}
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
