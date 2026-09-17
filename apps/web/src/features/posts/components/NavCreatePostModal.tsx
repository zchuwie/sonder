"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { MapPin, ShieldCheck, Expand } from "lucide-react";
import maplibregl from "maplibre-gl";
import { getOpenFreeMapStyle } from "@/features/map/lib/openfreemap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PhotoAttachmentPicker } from "./PhotoAttachmentPicker";
import { SongSearchPicker } from "./SongSearchPicker";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { MapSearchBar } from "@/features/map/components/MapSearchBar";
import { reverseGeocode } from "@/features/map/client/reverse-geocode";
import { FullScreenMapPicker } from "@/features/map/components/FullScreenMapPicker";
import { createPinMarkerElement } from "@/features/map/lib/map-markers";
import type { LocationPlaceDTO } from "@/features/map/lib/location-types";
import type { MarkerData, PostDraft, Music } from "@/features/posts/lib/post-types";

export function NavCreatePostModal({
  onClose,
  onSubmit,
  initialLocation,
}: {
  onClose: () => void;
  onSubmit: (marker: MarkerData, draft: PostDraft) => Promise<void>;
  initialLocation?: { lat: number; lng: number; placeName?: string } | null;
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const pin = useRef<maplibregl.Marker | null>(null);

  const [location, setLocation] = useState<{
    lat: number; lng: number; placeName?: string;
  } | null>(initialLocation ?? null);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [music, setMusic] = useState<Music | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [showFullMap, setShowFullMap] = useState(false);
  const handleToken = useCallback((token: string) => setTurnstileToken(token), []);

  const locationRef = useRef(location);
  locationRef.current = location;

  // Init map after dialog renders (RAF ensures container is visible)
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (!mapContainer.current || map.current) return;
      const startLat = locationRef.current?.lat ?? initialLocation?.lat ?? 14.5995;
      const startLng = locationRef.current?.lng ?? initialLocation?.lng ?? 120.9842;
      const m = new maplibregl.Map({
        container: mapContainer.current,
        style: getOpenFreeMapStyle(),
        center: [startLng, startLat],
        zoom: initialLocation ? 15 : 13,
        pitch: 50,
        fadeDuration: 0,
        renderWorldCopies: false,
        attributionControl: false,
      });
      const handlePin = async (lngLat: maplibregl.LngLat) => {
        const { lng, lat } = lngLat;
        placePinMap(lat, lng, m);
        const placeName = await reverseGeocode(lat, lng);
        setLocation({ lat, lng, placeName });
      };
      m.on("click", (e) => void handlePin(e.lngLat));
      m.on("dblclick", (e) => { e.preventDefault(); void handlePin(e.lngLat); });
      m.on("contextmenu", (e) => { e.preventDefault(); void handlePin(e.lngLat); });
      map.current = m;
      
      placePinMap(startLat, startLng, m);
    });
    return () => {
      cancelAnimationFrame(frame);
      map.current?.remove();
      map.current = null;
      pin.current?.remove();
      pin.current = null;
    };
  }, []);

  function placePinMap(lat: number, lng: number, m: maplibregl.Map) {
    if (pin.current) pin.current.setLngLat([lng, lat]);
    else {
      pin.current = new maplibregl.Marker({ element: createPinMarkerElement() })
        .setLngLat([lng, lat])
        .addTo(m);
    }
    m.flyTo({ center: [lng, lat], zoom: Math.max(m.getZoom(), 14) });
  }

  function handlePlaceSelect(place: LocationPlaceDTO) {
    if (!map.current) return;
    placePinMap(place.lat, place.lng, map.current);
    setLocation({ lat: place.lat, lng: place.lng, placeName: place.name });
  }

  async function submit() {
    if (!turnstileToken || submitting) return;
    if (!location) { toast.error("Pin a location on the map first."); return; }
    if (!title.trim()) { toast.error("Give your thought a title."); return; }
    setSubmitting(true);
    setSubmitError("");
    try {
      const marker: MarkerData = {
        id: `nav-${Date.now()}`,
        lat: location.lat,
        lng: location.lng,
        placeName: location.placeName,
        posts: [],
      };
      await onSubmit(marker, { title: title.trim(), text: text.trim(), imageUrl, imageFile, music, turnstileToken });
      toast.success("Thought submitted for review.");
      onClose();
    } catch (cause) {
      const msg = cause instanceof Error ? cause.message : "Unable to submit thought.";
      setSubmitError(msg);
      toast.error("Something went wrong. Please try again.");
      setSubmitting(false);
      setTurnstileToken("");
      setTurnstileReset((n) => n + 1);
    }
  }

  return (
    <>
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="grid h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-none grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-2xl border-primary/15 bg-background/97 p-0 shadow-[0_30px_90px_rgba(18,70,35,.26)] backdrop-blur-xl sm:max-w-none md:h-[min(840px,calc(100dvh-2rem))] md:w-full md:max-w-5xl md:rounded-[30px]">
        <DialogHeader className="border-b px-4 py-3 sm:px-5 sm:py-4 text-left">
          <DialogTitle className="text-lg sm:text-xl">Leave an anonymous thought</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5 text-xs sm:text-sm">
            <MapPin className="size-3.5 text-primary shrink-0" />
            <span className="truncate">{location?.placeName ?? "Search or tap the map to pin your thought"}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 overflow-y-auto md:overflow-hidden md:grid-cols-[1fr_1.2fr]">
          {/* Left — Location picker */}
          <div className="flex flex-col gap-2.5 border-b border-border p-3.5 sm:p-4 md:border-b-0 md:border-r md:p-5">
            <MapSearchBar onPlaceSelect={handlePlaceSelect} center={location ?? undefined} initialQuery={location?.placeName} disableRecent={true} />
            <div className="relative h-40 w-full shrink-0 sm:h-48 md:h-full md:min-h-[260px] md:flex-1">
              <div ref={mapContainer} className="size-full rounded-xl border border-border" />
              {/* Expand map button */}
              <button
                type="button"
                aria-label="Expand map"
                onClick={() => setShowFullMap(true)}
                className="absolute left-2.5 top-2.5 z-20 flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/95 px-2.5 py-1.5 text-xs font-medium text-foreground shadow-md backdrop-blur-sm transition hover:scale-105 active:scale-95"
              >
                <Expand className="size-3.5" />
                Expand
              </button>
            </div>
            {location && (
              <p className="font-mono text-[11px] text-muted-foreground truncate">
                📍 {location.placeName ? `${location.placeName} · ` : ""}{location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </p>
            )}
            <div className="hidden sm:flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>Approved posts become public. Avoid identifying information.</span>
            </div>
          </div>

          {/* Right — Post fields */}
          <div className="min-h-0 overflow-y-auto p-3.5 sm:p-4 md:p-5">
            <div className="mb-3.5 flex items-center gap-2.5 rounded-xl bg-primary/5 p-2.5 sm:p-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">?</span>
              <div>
                <p className="text-sm font-semibold">Publicly anonymous</p>
                <p className="text-[11px] text-muted-foreground">No profile name is shown with your post.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="nav-title" className="text-sm font-medium">Title <span className="text-primary">*</span></label>
                  <span className="text-xs text-muted-foreground">{title.length}/75</span>
                </div>
                <Input id="nav-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Give this thought a short title" maxLength={75} className="h-10 rounded-xl bg-muted/25 px-3.5 text-sm" />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="nav-thought" className="text-sm font-medium">Your thought <span className="font-normal text-muted-foreground">(optional)</span></label>
                  <span className="text-xs text-muted-foreground">{text.length}/500</span>
                </div>
                <Textarea id="nav-thought" value={text} onChange={(e) => setText(e.target.value)} placeholder="A memory, confession, or quiet thought..." maxLength={500} rows={4} className="min-h-24 rounded-xl bg-muted/25 px-3.5 py-2.5 text-sm leading-6" />
              </div>
              <div>
                <p className="mb-1.5 text-sm font-medium">Photo <span className="font-normal text-muted-foreground">(optional)</span></p>
                <PhotoAttachmentPicker value={imageUrl} onChange={setImageUrl} onFileChange={setImageFile} />
              </div>
              <div>
                <p className="mb-1.5 text-sm font-medium">Song <span className="font-normal text-muted-foreground">(optional)</span></p>
                <SongSearchPicker value={music} onChange={setMusic} />
              </div>
            </div>
            {submitError && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{submitError}</p>}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 border-t bg-background/95 px-5 py-3">
          <TurnstileWidget onToken={handleToken} resetKey={turnstileReset} />
          <div className="flex w-full items-center gap-2">
            <p className="flex-1 text-xs text-muted-foreground">Reviewed before publication. Do not include private information, threats, or identifying details.</p>
            <Button variant="ghost" className="rounded-xl" onClick={onClose} disabled={submitting}>Cancel</Button>
            <Button className="rounded-xl px-5" disabled={!turnstileToken || submitting} onClick={() => void submit()}>
              {submitting ? "Submitting..." : "Submit for review"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Full screen map picker */}
    {showFullMap && (
      <FullScreenMapPicker
        initialLat={location?.lat ?? 14.5995}
        initialLng={location?.lng ?? 120.9842}
        onDone={(loc) => {
          if (map.current) placePinMap(loc.lat, loc.lng, map.current);
          setLocation(loc);
          setShowFullMap(false);
        }}
        onClose={() => setShowFullMap(false)}
      />
    )}
    </>
  );
}
