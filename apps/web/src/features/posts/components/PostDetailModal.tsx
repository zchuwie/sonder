"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Clock3, Download, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MusicPreviewCard } from "./MusicPreviewCard";
import { ShareCardModal } from "./ShareCardModal";
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
  panelSide = 'right',
}: {
  post: AnonymousPost;
  onClose: () => void;
  panelSide?: 'left' | 'right';
}) {
  const [copied, setCopied] = useState(false);
  const [confirmShare, setConfirmShare] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const flagged = post.moderationStatus === "flagged";
  const smPos = panelSide === 'left'
    ? 'sm:left-20 sm:right-auto sm:top-1/2 sm:-translate-y-1/2 sm:bottom-auto'
    : 'sm:right-20 sm:left-auto sm:top-1/2 sm:-translate-y-1/2 sm:bottom-auto';

  return (
    <>
      <Dialog open modal={false} onOpenChange={(open) => { if (!open && !showCard) onClose(); }}>
        <DialogContent
          overlayClassName="bg-transparent pointer-events-none supports-backdrop-filter:backdrop-blur-none"
          className={`pointer-events-auto inset-x-2 bottom-2 top-auto flex w-auto max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-2xl border-black/10 bg-background/96 p-0 shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:w-[26rem] sm:rounded-3xl sm:max-h-[78dvh] ${smPos} ${expanded ? "max-h-[90dvh]" : "max-h-[55dvh]"}`}
        >
          {/* Image / cover */}
          {post.imageUrl && !flagged ? (
            <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-t-2xl sm:aspect-video sm:h-auto sm:rounded-t-3xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.imageUrl} alt="" className="size-full object-cover" />
            </div>
          ) : post.music?.coverUrl && !flagged ? (
            <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-t-2xl bg-linear-to-br from-primary/20 via-muted to-background sm:aspect-video sm:h-auto sm:rounded-t-3xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.music.coverUrl} alt="" className="size-full scale-110 object-cover opacity-30 blur-xl" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.music.coverUrl} alt="" className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-xl object-cover shadow-xl sm:size-32 sm:rounded-3xl" />
            </div>
          ) : null}

          {/* Scrollable content */}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3.5 sm:p-6">
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground sm:text-xs">
              <Clock3 className="size-3" /> {relativeTime(post.createdAt)}
            </span>
            <DialogHeader className="mt-1.5 space-y-1 text-left sm:mt-2 sm:space-y-2">
              <DialogTitle className="font-serif text-lg font-normal leading-snug tracking-[-0.01em] sm:text-2xl">
                {post.title}
              </DialogTitle>
              <DialogDescription className="sr-only">Anonymous post details</DialogDescription>
            </DialogHeader>
            <p className="mt-2 text-sm leading-relaxed text-foreground/80 sm:mt-3 sm:text-[15px] sm:leading-7">
              {flagged ? "This post was flagged for review." : post.text}
            </p>
            {post.music && !flagged && <div className="mt-4"><MusicPreviewCard music={post.music} /></div>}

            {post.moderationStatus === "pending" && (
              <p className="mt-4 text-center text-xs text-muted-foreground">Waiting for approval</p>
            )}
          </div>

          {/* Fixed bottom action bar */}
          {post.moderationStatus === "approved" && (
            <div className="flex shrink-0 items-center justify-between border-t border-border/50 bg-background/95 px-3.5 py-2.5 backdrop-blur-sm sm:px-6 sm:py-3">
              <div className="flex items-center gap-2">
                <ReportPostButton postId={post.id} iconOnly />
                {/* Expand/collapse toggle — mobile only */}
                <button
                  type="button"
                  aria-label={expanded ? "Collapse" : "Expand"}
                  className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:text-primary sm:hidden"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
                </button>
              </div>
              <div className="flex items-center gap-2">
                {/* Share card download */}
                <button
                  type="button"
                  aria-label="Download share card"
                  className="grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-all duration-200 hover:scale-110 hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                  onClick={(e) => { e.stopPropagation(); setShowCard(true); }}
                >
                  <Download className="size-4" />
                </button>
                {/* Copy link */}
                {confirmShare ? (
                  <>
                    <span className="text-[11px] text-muted-foreground">Copy link?</span>
                    <button
                      type="button"
                      aria-label="Confirm copy link"
                      className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground transition-all duration-200 hover:scale-110"
                      onClick={async () => {
                        await navigator.clipboard?.writeText(buildShareUrl(post));
                        setCopied(true);
                        setConfirmShare(false);
                        setTimeout(() => setCopied(false), 1800);
                      }}
                    >
                      <Check className="size-4" />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    aria-label={copied ? "Link copied" : "Share post"}
                    className={`grid size-9 place-items-center rounded-full border border-border text-muted-foreground transition-all duration-200 hover:scale-110 hover:border-primary/30 hover:bg-primary/5 hover:text-primary ${copied ? "border-primary/40 text-primary" : ""}`}
                    onClick={() => setConfirmShare(true)}
                  >
                    {copied ? <Check className="size-4" /> : <Send className="size-4" />}
                  </button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {showCard && <ShareCardModal post={post} onClose={() => setShowCard(false)} />}
    </>
  );
}
