"use client";

import { useState } from "react";
import { Check, Clock3, MapPin, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MusicPreviewCard } from "./MusicPreviewCard";
import { relativeTime } from "@/features/posts/lib/post-utils";
import type { AnonymousPost } from "@/features/posts/lib/post-types";
import { ReportPostButton } from "@/features/moderation/components/ReportPostButton";

export function buildShareUrl(post: AnonymousPost): string {
  if (post.moderationStatus !== "approved") {
    throw new Error("Only approved thoughts can be shared.");
  }
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/p/${encodeURIComponent(post.id)}`;
}

export default function PostDetailModal({
  post,
  onClose,
}: {
  post: AnonymousPost;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const flagged = post.moderationStatus === "flagged";
  const canShare = post.moderationStatus === "approved";

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-none gap-0 overflow-hidden rounded-2xl border-primary/15 bg-background/96 p-0 shadow-[0_30px_90px_rgba(18,70,35,.24)] backdrop-blur-xl sm:max-h-[88dvh] sm:w-full sm:max-w-xl sm:rounded-[30px]">
        <ScrollArea className="max-h-[calc(100dvh-5.5rem)] sm:max-h-[calc(88dvh-72px)]">
          <div className="p-2.5 sm:p-3">
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-muted to-background sm:rounded-[24px]">
              {post.imageUrl && !flagged ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.imageUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : post.music?.coverUrl && !flagged ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.music.coverUrl}
                    alt=""
                    className="size-full scale-110 object-cover opacity-30 blur-xl"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.music.coverUrl}
                    alt=""
                    className="absolute left-1/2 top-1/2 size-32 -translate-x-1/2 -translate-y-1/2 rounded-3xl object-cover shadow-xl"
                  />
                </>
              ) : (
                <div className="grid size-full place-items-center px-10 text-center text-sm text-muted-foreground">
                  Someone left a thought here.
                </div>
              )}
            </div>
          </div>
          <DialogHeader className="space-y-3 px-4 pb-3 pt-2 text-left sm:space-y-4 sm:px-6 sm:pb-4 sm:pt-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="rounded-full px-3">
                Anonymous
              </Badge>
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />{" "}
                {post.placeName ?? "Pinned nearby"}
              </span>
              <span className="flex items-center gap-1">
                <Clock3 className="size-3.5" /> {relativeTime(post.createdAt)}
              </span>
            </div>
            <DialogTitle className="text-left text-xl leading-7 sm:text-2xl sm:leading-8">
              {post.title}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Anonymous post preview
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-4 pb-4 sm:space-y-5 sm:px-6 sm:pb-6">
            <p className="whitespace-pre-wrap text-[15px] leading-7">
              {flagged ? "This post was flagged for review." : post.text}
            </p>
            {post.music && !flagged && <MusicPreviewCard music={post.music} />}
            <p className="rounded-2xl bg-primary/5 p-4 text-xs leading-5 text-muted-foreground">
              Be kind. Posts are publicly anonymous, moderated, and
              abuse-protected.
            </p>
          </div>
        </ScrollArea>
        <DialogFooter className="flex-row items-center border-t px-4 py-3 pb-[max(.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-4">
          <ReportPostButton postId={post.id} />
          {canShare ? (
            <Button
              className="ml-auto rounded-xl px-5"
              onClick={async () => {
                await navigator.clipboard?.writeText(buildShareUrl(post));
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              }}
            >
              {copied ? <Check /> : <Share2 />}
              {copied ? "Copied" : "Share"}
            </Button>
          ) : (
            <p className="ml-auto text-xs text-muted-foreground">
              Sharing is available after approval.
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
