"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { MapPin, ShieldCheck } from "lucide-react";
import maplibregl from "maplibre-gl";
import { getOpenFreeMapStyle } from "@repo/map-config";
import { useTheme } from "next-themes";
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
import type { LocationPlaceDTO } from "@/features/map/lib/location-types";
import type { MarkerData, PostDraft, Music } from "@/features/posts/lib/post-types";

export function NavCreatePostModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (marker: MarkerData, draft: PostDraft) => Promise<void>;
}) {
  const { resolvedTheme } = useTheme();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const pin = useRef<maplibregl.Marker | null>(null);

  const [location, setLocation] = useState<{
    lat: number; lng: number; placeName?: string;
  } | null>(null);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [music, setMusic] = useState<Music | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const handleToken = useCallback((token: string) => setTurnstileToken(token), []);

  const canSubmit = Boolean(location && title.trim() && text.trim() && turnstileToken);

  // Init map after dialog renders (RAF ensures container is visible)
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (!mapContainer.current || map.current) return;
      const m = new maplibregl.Map({
        container: mapContainer.current,
        style: getOpenFreeMapStyle(resolvedTheme),
        center: [120.9842, 14.5995],
        zoom: 12,
        attributionControl: false,
      });
      const handlePin = async (lngLat: maplibregl.LngLat) => {
        const { lng, lat } = lngLat;
        placePin(lat, lng);
        const placeName = await reverseGeocode(lat, lng);
        setLocation({ lat, lng, placeName });
      };
      m.on("click", (e) => void handlePin(e.lngLat));
      m.on("dblclick", (e) => { e.preventDefault(); void handlePin(e.lngLat); });
      m.on("contextmenu", (e) => { e.preventDefault(); void handlePin(e.lngLat); });
      map.current = m;
    });
    return () => {
      cancelAnimationFrame(frame);
      map.current?.remove();
      map.current = null;
    };
  }, []);

  function placePin(lat: number, lng: number) {
    if (!map.current) return;
    if (pin.current) pin.current.setLngLat([lng, lat]);
    else {
      pin.current = new maplibregl.Marker({ color: "#245236" })
        .setLngLat([lng, lat])
        .addTo(map.current);
    }
    map.current.flyTo({ center: [lng, lat], zoom: Math.max(map.current.getZoom(), 14) });
  }

  function handlePlaceSelect(place: LocationPlaceDTO) {
    placePin(place.lat, place.lng);
    setLocation({ lat: place.lat, lng: place.lng, placeName: place.name });
  }

  async function submit() {
    if (!canSubmit || submitting || !location) return;
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
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="grid h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-none grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-2xl border-primary/15 bg-background/97 p-0 shadow-[0_30px_90px_rgba(18,70,35,.26)] backdrop-blur-xl md:h-[min(760px,calc(100dvh-2rem))] md:w-full md:max-w-5xl md:rounded-[30px]">
        <DialogHeader className="border-b px-5 py-4 text-left">
          <DialogTitle className="text-lg">Leave an anonymous thought</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5 text-xs">
            <MapPin className="size-3.5" />
            {location?.placeName ?? "Search or click the map to pin your thought"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 overflow-hidden md:grid-cols-[1fr_1.1fr]">
          {/* Left — Location picker */}
          <div className="flex flex-col gap-3 border-r border-border p-5">
            <MapSearchBar onPlaceSelect={handlePlaceSelect} center={location ?? undefined} />
            <div ref={mapContainer} style={{ height: "100%", minHeight: 280 }} className="w-full rounded-xl border border-border" />
            {location && (
              <p className="font-mono text-[11px] text-muted-foreground">
                📍 {location.placeName ? `${location.placeName} · ` : ""}{location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </p>
            )}
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>Approved posts and selected locations become public. Avoid identifying information.</span>
            </div>
          </div>

          {/* Right — Post fields */}
          <div className="min-h-0 overflow-y-auto p-5">
            <div className="mb-4 flex items-center gap-3 rounded-2xl bg-primary/5 p-3">
              <span className="grid size-8 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">?</span>
              <div>
                <p className="text-sm font-semibold">Publicly anonymous</p>
                <p className="text-[11px] text-muted-foreground">No profile name is shown with your post.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="nav-title" className="mb-1.5 block text-sm font-medium">Title <span className="text-primary">*</span></label>
                <Input id="nav-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Give this thought a short title" maxLength={50} className="h-10 rounded-2xl bg-muted/25 px-4" />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="nav-thought" className="text-sm font-medium">Your thought <span className="text-primary">*</span></label>
                  <span className="text-[10px] text-muted-foreground">{text.length}/500</span>
                </div>
                <Textarea id="nav-thought" value={text} onChange={(e) => setText(e.target.value)} placeholder="A memory, confession, or quiet thought..." maxLength={500} rows={4} className="rounded-2xl bg-muted/25 px-4 py-3 leading-6" />
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
            <Button className="rounded-xl px-5" disabled={!canSubmit || submitting} onClick={() => void submit()}>
              {submitting ? "Submitting..." : "Submit for review"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
