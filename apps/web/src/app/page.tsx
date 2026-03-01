"use client";

import { useState } from "react";
import MapContainer from "../components/Map";
import MarkerSidebar, { type MarkerData } from "../components/CustomPopup";

export default function Home() {
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  const handleMarkerAdd = (marker: MarkerData) => {
    setMarkers((prev) => [...prev, marker]);
    setSelectedMarkerId(marker.id);
  };

  const handleAddPost = (markerId: string, content: string) => {
    setMarkers((prev) =>
      prev.map((m) =>
        m.id === markerId
          ? {
              ...m,
              posts: [
                ...m.posts,
                {
                  id: crypto.randomUUID(),
                  content,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : m,
      ),
    );
  };

  const selectedMarker = markers.find((m) => m.id === selectedMarkerId) ?? null;

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <MapContainer
        markers={markers}
        selectedMarkerId={selectedMarkerId}
        onMarkerAdd={handleMarkerAdd}
        onMarkerSelect={setSelectedMarkerId}
      />
      <MarkerSidebar marker={selectedMarker} onAddPost={handleAddPost} />
    </div>
  );
}
