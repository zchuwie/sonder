"use client";

import { useState, useEffect } from "react";
import MapContainer from "../components/MapComponent";
import MarkerSidebar, {
  type MarkerData,
  type PostDraft,
} from "../components/PostPopup";
import CreatePostModal from "../components/CreatePostModal";
import LocationInfo from "../components/LocationInfo";
import { ThemeToggle } from "../components/ThemeToggle";
import { SearchBar } from "../components/SearchBar";
import { LocationPlaceDTO } from "../types/location.dto";
import { useUser } from "../contexts/UserContext";
import AccountModal from "../components/AccountModal";

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [accountOpen, setAccountOpen] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (createPostOpen) {
        setCreatePostOpen(false);
      } else {
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
        return { ...m, posts: [...m.posts, newPost] } as typeof m;
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

      <LocationInfo
        place={selectedPlace}
        isOpen={locationInfoOpen}
        onToggle={() => setLocationInfoOpen((o) => !o)}
        onFlyTo={handleFlyTo}
        onClose={() => setLocationInfoOpen(false)}
      />

      <MarkerSidebar marker={selectedMarker} onOpenChange={setSidebarOpen} />

      {/* + New Post FAB — always visible; prompts login if no account, grayed if no pin */}
      {(() => {
        const hasPin = !!selectedMarkerId;
        const active = !!user && hasPin;
        return (
          <button
            type="button"
            onClick={() => {
              if (!user) {
                setAccountOpen(true);
              } else if (hasPin) {
                setCreatePostOpen(true);
              }
            }}
            title={
              !user
                ? "Sign in to post"
                : hasPin
                  ? "Create a new post"
                  : "Select a pin on the map first"
            }
            className="absolute flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold shadow-lg transition-all duration-300 active:scale-95"
            style={{
              bottom: "2rem",
              right: sidebarOpen ? "calc(320px + 1.5rem)" : "1.5rem",
              zIndex: 30,
              background: active ? "var(--primary)" : "var(--muted)",
              color: "#fff",
              boxShadow: "0 4px 20px rgba(0,0,0,.25)",
              opacity: active ? 1 : 0.45,
              cursor: active || !user ? "pointer" : "not-allowed",
            }}
            aria-label="Create new post"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {!user ? "Sign in" : "New Post"}
          </button>
        );
      })()}

      {/* Create Post Modal */}
      {createPostOpen && selectedMarker && (
        <CreatePostModal
          marker={selectedMarker}
          onClose={() => setCreatePostOpen(false)}
          onSubmit={(draft) => handleAddPost(selectedMarker.id, draft)}
        />
      )}

      {/* Account modal (login prompt) */}
      {accountOpen && <AccountModal onClose={() => setAccountOpen(false)} />}
    </div>
  );
}
