import { Suspense } from "react";
import { MapExperience } from "@/features/map/components/MapExperience";

export default function MapPage() {
  return (
    <Suspense fallback={<div className="h-dvh w-screen bg-muted" />}>
      <MapExperience />
    </Suspense>
  );
}
