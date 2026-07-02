"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PhotoAttachmentPicker } from "./PhotoAttachmentPicker";
import { SongSearchPicker } from "./SongSearchPicker";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { CreateMapPicker } from "@/features/map/components/CreateMapPicker";
import { createSupabasePost } from "@/features/posts/client/use-create-post";
import { getFunctionErrorMessage } from "@/lib/supabase/function-error";
import type { Music } from "@/features/posts/lib/post-types";

export function CreateThoughtPage() {
  const router = useRouter();
  const [location, setLocation] = useState<{ lat: number; lng: number; placeName?: string } | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [music, setMusic] = useState<Music | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const handleToken = useCallback((token: string) => setTurnstileToken(token), []);

  async function submit() {
    if (!turnstileToken || inFlight.current) return;
    if (!location) { toast.error("Pin a location on the map first."); return; }
    if (!title.trim()) { toast.error("Give your thought a title."); return; }
    inFlight.current = true;
    setSubmitting(true);
    setError("");
    try {
      const marker = { id: "create", lat: location.lat, lng: location.lng, placeName: location.placeName, posts: [] };
      await createSupabasePost(marker, { title: title.trim(), text: body.trim(), imageUrl, imageFile, music, turnstileToken });
      toast.success("Thought submitted for review.");
      router.push("/map");
    } catch (cause) {
      const msg = await getFunctionErrorMessage(cause, "Unable to submit. Please try again.");
      setError(msg);
      toast.error("Something went wrong.");
      setTurnstileToken("");
      setTurnstileReset((n) => n + 1);
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto min-h-dvh max-w-4xl px-4 py-8 sm:py-12">
      <header className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl">Leave a thought</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pin an anonymous thought to a place. It will be reviewed before appearing on the map.
        </p>
      </header>

      {/* Two-column on desktop, stacked on mobile */}
      <div className="grid gap-6 lg:grid-cols-[55fr_45fr]">
        {/* Left column — form fields */}
        <div className="space-y-5">
          <section>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="title" className="text-sm font-medium">
                Title <span className="text-primary">*</span>
              </label>
              <span className="text-[11px] text-muted-foreground">{title.length}/75</span>
            </div>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="A short title for your thought"
              maxLength={75}
              className="rounded-xl"
            />
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="body" className="text-sm font-medium">
                Your thought <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <span className="text-[11px] text-muted-foreground">{body.length}/500</span>
            </div>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="A memory, confession, or quiet thought..."
              maxLength={500}
              rows={5}
              className="rounded-xl"
            />
          </section>

          <section>
            <p className="mb-2 text-sm font-medium">Photo <span className="font-normal text-muted-foreground">(optional)</span></p>
            <PhotoAttachmentPicker value={imageUrl} onChange={setImageUrl} onFileChange={setImageFile} />
          </section>

          <section>
            <p className="mb-2 text-sm font-medium">Song <span className="font-normal text-muted-foreground">(optional)</span></p>
            <SongSearchPicker value={music} onChange={setMusic} />
          </section>

          {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <TurnstileWidget onToken={handleToken} resetKey={turnstileReset} />

          <Button
            className="h-12 w-full rounded-xl text-base"
            disabled={!turnstileToken || submitting}
            onClick={() => void submit()}
          >
            {submitting ? "Submitting..." : "Submit for review"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Approved posts and their location become public. Avoid private or identifying information.
          </p>
        </div>

        {/* Right column — map picker */}
        <div className="flex flex-col">
          <label className="mb-2 flex items-center gap-1 text-sm font-medium">
            <MapPin className="size-4" /> Location <span className="text-primary">*</span>
          </label>
          <div className="min-h-[280px] flex-1 overflow-hidden rounded-2xl border border-border lg:min-h-0">
            <CreateMapPicker onLocationConfirm={setLocation} />
          </div>
          {location && (
            <p className="mt-2 text-xs text-muted-foreground">
              📍 {location.placeName ?? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
            </p>
          )}
        </div>
      </div>

      <footer className="mt-12 border-t border-border pt-4 text-center text-[11px] text-muted-foreground">
        <a href="/privacy" className="hover:underline">Privacy</a>
        {" · "}
        <a href="/terms" className="hover:underline">Terms</a>
        {" · "}
        <a href="/community-guidelines" className="hover:underline">Community</a>
        {" · "}
        <a href="/safety" className="hover:underline">Safety</a>
      </footer>
    </main>
  );
}
