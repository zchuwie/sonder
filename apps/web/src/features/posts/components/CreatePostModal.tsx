"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { MapPin } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MiniMapPreview } from "@/features/map/components/MiniMapPreview";
import { PhotoAttachmentPicker } from "./PhotoAttachmentPicker";
import { SongSearchPicker } from "./SongSearchPicker";
import { TurnstileWidget } from "@/components/TurnstileWidget";
import { AnonymousPostCard } from "./AnonymousPostCard";
import type { MarkerData, PostDraft, AnonymousPost } from "@/features/posts/lib/post-types";
import { getPostType } from "@/features/posts/lib/post-utils";
import { usePostDraftStore } from "@/features/posts/store/use-post-draft-store";

export default function CreatePostModal({
  marker,
  onClose,
  onSubmit,
}: {
  marker: MarkerData;
  onClose: () => void;
  onSubmit: (draft: PostDraft) => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const handleToken = useCallback((token: string) => setTurnstileToken(token), []);
  const title = usePostDraftStore((state) => state.title);
  const text = usePostDraftStore((state) => state.text);
  const imageUrl = usePostDraftStore((state) => state.imageUrl);
  const music = usePostDraftStore((state) => state.music);
  const setTitle = usePostDraftStore((state) => state.setTitle);
  const setText = usePostDraftStore((state) => state.setText);
  const setImageUrl = usePostDraftStore((state) => state.setImageUrl);
  const setImageFile = usePostDraftStore((state) => state.setImageFile);
  const setMusic = usePostDraftStore((state) => state.setMusic);
  const prepareForLocation = usePostDraftStore(
    (state) => state.prepareForLocation,
  );
  const getDraft = usePostDraftStore((state) => state.getDraft);
  const resetDraft = usePostDraftStore((state) => state.reset);

  useEffect(() => {
    prepareForLocation(marker);
  }, [marker, prepareForLocation]);

  const submit = async () => {
    if (!turnstileToken || submitting) return;
    if (!title.trim()) { toast.error("Give your thought a title."); return; }
    setSubmitting(true);
    setSubmitError("");
    try {
      await onSubmit({ ...getDraft(), turnstileToken });
      resetDraft();
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
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="grid h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-none grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-2xl border-primary/15 bg-background/97 p-0 shadow-[0_30px_90px_rgba(18,70,35,.26)] backdrop-blur-xl md:h-[calc(100dvh-3rem)] md:w-[calc(100vw-4rem)] md:max-w-[1280px] md:rounded-[30px]">
        <DialogHeader className="border-b px-4 py-3 pr-12 text-left sm:px-5 sm:py-4 md:px-6">
          <DialogTitle className="text-lg">
            Leave an anonymous thought
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <MapPin className="size-3.5" />{" "}
            {marker.placeName ??
              `${marker.lat.toFixed(4)}, ${marker.lng.toFixed(4)}`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 grid-rows-[200px_minmax(0,1fr)] overflow-hidden md:grid-cols-[1fr_1.1fr] md:grid-rows-1">
          <div className="min-h-0 border-b md:border-b-0 md:border-r">
            <MiniMapPreview marker={marker} previewImage={imageUrl} />
          </div>
          <div className="min-h-0 space-y-3 overflow-y-auto p-3.5 sm:p-4 md:p-5">
            {isPreview ? (
              <div className="mx-auto w-full max-w-sm">
                <p className="mb-4 text-center text-sm font-medium text-muted-foreground">Preview your thought</p>
                <AnonymousPostCard
                  post={{
                    id: "preview",
                    userId: "preview",
                    title,
                    type: getPostType({ title, text, imageUrl, music }),
                    text,
                    imageUrl,
                    music,
                    lat: marker.lat,
                    lng: marker.lng,
                    placeName: marker.placeName,
                    moderationStatus: "pending",
                    createdAt: new Date().toISOString(),
                    likes: 0,
                    reports: 0,
                  } as AnonymousPost}
                />
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="title" className="text-xs font-medium">
                      Title <span className="text-primary">*</span>
                    </label>
                    <span className="text-[10px] text-muted-foreground">
                      {title.length}/75
                    </span>
                  </div>
                  <Input
                    id="title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Give this thought a short title"
                    maxLength={75}
                    className="h-10 rounded-xl bg-muted/25 px-3.5 text-base"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="thought" className="text-xs font-medium">
                      Your thought <span className="font-normal text-muted-foreground">(optional)</span>
                    </label>
                    <span className="text-[10px] text-muted-foreground">
                      {text.length}/500
                    </span>
                  </div>
                  <Textarea
                    id="thought"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="A memory, confession, or quiet thought..."
                    maxLength={500}
                    className="min-h-28 rounded-xl bg-muted/25 px-3.5 py-3 text-base leading-7"
                  />
                </div>
                <div className="space-y-2.5">
                  <div>
                    <p className="text-xs font-medium">
                      Photo <span className="font-normal text-muted-foreground">(optional)</span>
                    </p>
                    <PhotoAttachmentPicker
                      value={imageUrl}
                      onChange={setImageUrl}
                      onFileChange={setImageFile}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium">
                      Song <span className="font-normal text-muted-foreground">(optional)</span>
                    </p>
                    <SongSearchPicker value={music} onChange={setMusic} />
                  </div>
                </div>
              </>
            )}
            {submitError && (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 border-t bg-background/95 px-3 py-2 pb-[max(.5rem,env(safe-area-inset-bottom))] sm:px-5 sm:py-2.5">
          <TurnstileWidget onToken={handleToken} resetKey={turnstileReset} />
          <div className="flex w-full items-center justify-end gap-2">
            {!isPreview ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-xs"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="rounded-xl px-4 text-xs"
                  onClick={() => {
                    if (!title.trim()) { toast.error("Give your thought a title."); return; }
                    setIsPreview(true);
                  }}
                >
                  Next: Preview
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-xs"
                  onClick={() => setIsPreview(false)}
                  disabled={submitting}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  className="rounded-xl px-4 text-xs"
                  disabled={!turnstileToken || submitting}
                  onClick={() => void submit()}
                >
                  {submitting ? "Submitting..." : "Submit"}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
