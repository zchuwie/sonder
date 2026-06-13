"use client";

import { useState } from "react";
import { MapPin, ShieldCheck } from "lucide-react";
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
import type {
  MarkerData,
  Music,
  PostDraft,
} from "@/features/posts/lib/post-types";

export default function CreatePostModal({
  marker,
  onClose,
  onSubmit,
}: {
  marker: MarkerData;
  onClose: () => void;
  onSubmit: (draft: PostDraft) => void;
}) {
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState<string>();
  const [imageFile, setImageFile] = useState<File>();
  const [music, setMusic] = useState<Music>();
  const canSubmit = Boolean(title.trim() && text.trim());
  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      title: title.trim(),
      text: text.trim(),
      imageUrl,
      imageFile,
      music,
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="grid h-[min(760px,calc(100dvh-2rem))] max-h-none grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-[30px] border-primary/15 bg-background/97 p-0 shadow-[0_30px_90px_rgba(18,70,35,.26)] backdrop-blur-xl sm:max-w-4xl">
        <DialogHeader className="border-b px-6 py-4 pr-14 text-left">
          <DialogTitle className="text-lg">
            Leave an anonymous thought
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <MapPin className="size-3.5" />{" "}
            {marker.placeName ??
              `${marker.lat.toFixed(4)}, ${marker.lng.toFixed(4)}`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 overflow-y-auto sm:grid-cols-[.78fr_1.22fr] sm:overflow-hidden">
          <div className="hidden min-h-0 border-r sm:block">
            <MiniMapPreview marker={marker} />
          </div>
          <div className="min-h-0 space-y-3 overflow-y-auto p-4 sm:p-5">
            <div className="flex items-center gap-3 rounded-2xl bg-primary/5 p-3">
              <span className="grid size-8 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                ?
              </span>
              <div>
                <p className="text-sm font-semibold">Anonymous</p>
                <p className="text-[11px] text-muted-foreground">
                  No public profile is attached. Pending thoughts stay tied to
                  this browser session.
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
              Posts are public and anonymous. Avoid personal information.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t bg-background/95 px-5 py-3">
          <p className="hidden flex-1 text-xs text-muted-foreground sm:block">
            Your title and thought are required. Attachments are optional.
          </p>
          <Button variant="ghost" className="rounded-xl" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="rounded-xl px-5"
            disabled={!canSubmit}
            onClick={submit}
          >
            Submit for review
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
