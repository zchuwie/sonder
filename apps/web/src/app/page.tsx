"use client";

import { useState, useEffect, useRef } from "react";
import MapContainer from "../components/map/MapComponent";
import MarkerSidebar, {
  type MarkerData,
  type PostDraft,
} from "../components/posts/PostPopup";
import CreatePostModal from "../components/posts/CreatePostModal";
import LocationInfo from "../components/map/LocationInfo";
import { SearchBar } from "../components/ui/SearchBar";
import { LocationPlaceDTO } from "../types/location.dto";
import AccountModal from "../components/modals/AccountModal";

type FlyToTarget = { lat: number; lng: number; zoom?: number } | null;

export default function Home() {
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<LocationPlaceDTO | null>(
    null,
  );
  const [locationInfoOpen, setLocationInfoOpen] = useState(false);
  const [flyTo, setFlyTo] = useState<FlyToTarget>(null);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const selectedMarkerIdRef = useRef(selectedMarkerId);
  useEffect(() => {
    selectedMarkerIdRef.current = selectedMarkerId;
  }, [selectedMarkerId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (createPostOpen) {
        setCreatePostOpen(false);
      } else {
        const id = selectedMarkerIdRef.current;
        if (id) {
          setMarkers((prev) => {
            const m = prev.find((p) => p.id === id);
            return m && m.posts.length === 0
              ? prev.filter((p) => p.id !== id)
              : prev;
          });
        }
        setSelectedMarkerId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [createPostOpen]);

  const handleMarkerAdd = (marker: MarkerData) => {
    setMarkers((prev) => [...prev, marker]);
    setSelectedMarkerId(marker.id);
  };

  const handleAddPost = (markerId: string, draft: PostDraft) => {
    setMarkers((prev) =>
      prev.map((m) => {
        if (m.id !== markerId) return m;
        const newPost = {
          id: crypto.randomUUID(),
          content: draft.content,
          imageUrl: draft.imageUrl,
          song: draft.song,
          author: draft.author,
          isAnonymous: draft.isAnonymous,
          createdAt: new Date().toISOString(),
        };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { source: _s, ...rest } = m;
        return { ...rest, posts: [...m.posts, newPost] } as typeof m;
      }),
    );
  };

  const handlePlaceSelect = (place: LocationPlaceDTO) => {
    setSelectedPlace(place);
    setLocationInfoOpen(true);
    setFlyTo({ lat: place.lat, lng: place.lng, zoom: 15 });

    setMarkers((prev) => {
      const withoutOldSearch = prev.filter((m) => m.source !== "search");
      const newMarker: MarkerData = {
        id: place.id,
        lat: place.lat,
        lng: place.lng,
        posts: [],
        source: "search",
      };
      setSelectedMarkerId(newMarker.id);
      return [...withoutOldSearch, newMarker];
    });
  };

  const handleFlyTo = (place: LocationPlaceDTO) => {
    setFlyTo({ lat: place.lat, lng: place.lng, zoom: 15 });
  };

  const selectedMarker = markers.find((m) => m.id === selectedMarkerId) ?? null;

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 w-full max-w-2xl">
          <div className="flex-1">
            <SearchBar onPlaceSelect={handlePlaceSelect} />
          </div>
        </div>
      </div>

      <MapContainer
        markers={markers}
        selectedMarkerId={selectedMarkerId}
        onMarkerAdd={handleMarkerAdd}
        onMarkerSelect={setSelectedMarkerId}
        flyTo={flyTo}
      />

      {/* LocationInfo — desktop only */}
      <div className="hidden sm:block">
        <LocationInfo
          place={selectedPlace}
          isOpen={locationInfoOpen}
          onToggle={() => setLocationInfoOpen((o) => !o)}
          onFlyTo={handleFlyTo}
          onClose={() => setLocationInfoOpen(false)}
        />
      </div>

      <MarkerSidebar
        marker={selectedMarker}
        onNewPost={() => setCreatePostOpen(true)}
      />

      {createPostOpen && selectedMarker && (
        <CreatePostModal
          marker={selectedMarker}
          onClose={() => setCreatePostOpen(false)}
          onSubmit={(draft) => handleAddPost(selectedMarker.id, draft)}
        />
      )}

      {accountOpen && <AccountModal onClose={() => setAccountOpen(false)} />}
    </div>
  );
}
