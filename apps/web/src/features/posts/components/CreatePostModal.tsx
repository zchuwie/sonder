"use client";

import { useEffect, useState } from "react";
import { MapPin, ShieldCheck } from "lucide-react";
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
import type { MarkerData, PostDraft } from "@/features/posts/lib/post-types";
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
  const [submitError, setSubmitError] = useState("");
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

  const canSubmit = Boolean(title.trim() && text.trim());
  const submit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await onSubmit(getDraft());
      resetDraft();
      onClose();
    } catch (cause) {
      setSubmitError(
        cause instanceof Error ? cause.message : "Unable to submit thought.",
      );
      setSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="grid h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-none grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-2xl border-primary/15 bg-background/97 p-0 shadow-[0_30px_90px_rgba(18,70,35,.26)] backdrop-blur-xl md:h-[min(760px,calc(100dvh-2rem))] md:w-full md:max-w-4xl md:rounded-[30px]">
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

        <div className="grid min-h-0 grid-rows-[150px_minmax(0,1fr)] overflow-hidden md:grid-cols-[.78fr_1.22fr] md:grid-rows-1">
          <div className="min-h-0 border-b md:border-b-0 md:border-r">
            <MiniMapPreview marker={marker} />
          </div>
          <div className="min-h-0 space-y-3 overflow-y-auto p-3.5 sm:p-4 md:p-5">
            <div className="flex items-center gap-3 rounded-2xl bg-primary/5 p-3">
              <span className="grid size-8 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                ?
              </span>
              <div>
                <p className="text-sm font-semibold">Publicly anonymous</p>
                <p className="text-[11px] text-muted-foreground">
                  No profile name is shown, but technical identifiers may be
                  processed for safety and abuse prevention.
                </p>
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="title" className="text-sm font-medium">
                Title <span className="text-primary">*</span>
              </label>
              <Input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Give this thought a short title"
                maxLength={80}
                className="h-10 rounded-2xl bg-muted/25 px-4"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="thought" className="text-sm font-medium">
                  Your thought <span className="text-primary">*</span>
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
                className="min-h-24 rounded-2xl bg-muted/25 px-4 py-3 leading-6"
              />
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <p className="text-sm font-medium">
                  Photo{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </p>
                <PhotoAttachmentPicker
                  value={imageUrl}
                  onChange={setImageUrl}
                  onFileChange={setImageFile}
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium">
                  Song{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </p>
                <SongSearchPicker value={music} onChange={setMusic} />
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-2xl border border-primary/10 bg-primary/5 p-3 text-xs leading-5 text-muted-foreground sm:hidden">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              Approved posts and their selected location become public. Avoid
              private or identifying information.
            </div>
            {submitError && (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 border-t bg-background/95 px-3 py-2.5 pb-[max(.625rem,env(safe-area-inset-bottom))] sm:gap-3 sm:px-5 sm:py-3">
          <p className="hidden flex-1 text-xs text-muted-foreground sm:block">
            Reviewed before publication. Do not include private information,
            threats, harassment, or identifying details.
          </p>
          <Button
            variant="ghost"
            className="rounded-xl"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            className="rounded-xl px-5"
            disabled={!canSubmit || submitting}
            onClick={() => void submit()}
          >
            {submitting ? "Submitting..." : "Submit for review"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
