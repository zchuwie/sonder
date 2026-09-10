"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  X,
  Plus,
  Copy,
  ExternalLink,
  MapPin,
  Sparkles,
  Clock3,
  ChevronUp,
  ChevronDown,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import type { AnonymousPost, MarkerData } from "@/features/posts/lib/post-types";
import { relativeTime } from "@/features/posts/lib/post-utils";
import { PostClusterList } from "@/features/posts/components/PostClusterList";
import { MusicPreviewCard } from "@/features/posts/components/MusicPreviewCard";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchSignedPostImageUrl } from "@/lib/storage/image-url";
import { buildShareUrl } from "@/features/posts/components/PostDetailModal";

export function MapPlaceBottomSheet({
  marker,
  onClose,
  onCreatePost,
}: {
  marker: MarkerData | null;
  onClose: () => void;
  onCreatePost: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [signedImageUrl, setSignedImageUrl] = useState<string | null>(null);

  // Reset selected post when marker changes
  useEffect(() => {
    setSelectedPostId(null);
    setIsExpanded(false);
  }, [marker?.id]);

  const posts = marker?.posts ?? [];
  const placeName = marker?.placeName || "Selected Location";
  const hasPosts = posts.length > 0;

  // Single post: immediately show; Multi-post: show if user clicked one
  const activePost =
    posts.length === 1
      ? posts[0]!
      : posts.find((p) => p.id === selectedPostId) ?? null;

  // Fetch signed image URL when viewing an active post with an imagePath
  useEffect(() => {
    if (!activePost) {
      setSignedImageUrl(null);
      return;
    }
    setSignedImageUrl(activePost.imageUrl ?? null);
    if (!activePost.imageUrl && activePost.imagePath) {
      void fetchSignedPostImageUrl(activePost.id).then((url) => {
        if (url) setSignedImageUrl(url);
      });
    }
  }, [activePost]);

  if (!marker) return null;

  const handleCopyPlaceLink = () => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/map?marker=${encodeURIComponent(marker.id)}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Place link copied"))
      .catch(() => toast.error("Failed to copy link"));
  };

  const handleCopyPostLink = (post: AnonymousPost) => {
    try {
      const url = buildShareUrl(post);
      navigator.clipboard
        .writeText(url)
        .then(() => toast.success("Thought link copied"))
        .catch(() => toast.error("Failed to copy link"));
    } catch {
      handleCopyPlaceLink();
    }
  };

  const handleOpenGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${marker.lat},${marker.lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <AnimatePresence>
      <motion.div
        key={marker.id}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.y > 90 || info.velocity.y > 350) {
            onClose();
          } else if (info.offset.y < -50 || info.velocity.y < -300) {
            setIsExpanded(true);
          } else if (info.offset.y > 40) {
            setIsExpanded(false);
          }
        }}
        className={`fixed inset-x-0 bottom-0 z-40 flex flex-col rounded-t-[28px] border-t border-black/10 bg-background/98 shadow-2xl backdrop-blur-2xl transition-[height] duration-200 dark:border-white/10 sm:hidden ${
          isExpanded ? "h-[85dvh]" : hasPosts ? "h-[54dvh]" : "h-auto max-h-[50dvh]"
        }`}
      >
        {/* Drag handle */}
        <div
          className="flex w-full cursor-grab active:cursor-grabbing justify-center pt-2.5 pb-1 touch-none"
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
        </div>

        {/* ── CASE 1: Empty Pin / Hold to Drop Prompt ───────────────── */}
        {!hasPosts ? (
          <div className="flex flex-col px-5 pb-8 pt-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <MapPin className="size-3.5" /> New thought location
              </span>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-3">
              <h2 className="font-serif text-xl font-bold leading-snug text-foreground">
                Do you want to share your thoughts in this location?
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                📍 {placeName}
              </p>
              <p className="mt-2.5 text-xs leading-relaxed text-foreground/80">
                Leave a moment, a photo, or a song behind for others to discover when they pass by.
              </p>
            </div>

            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={onCreatePost}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition active:scale-98"
              >
                <Plus className="size-4" /> Share your thought here
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-black/10 bg-muted/60 px-4 py-3 text-xs font-medium text-foreground/80 transition hover:bg-muted active:scale-98 dark:border-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : activePost ? (
          /* ── CASE 2: Single Post OR Active Post Detail ───────────── */
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* Top Navigation */}
            <div className="flex shrink-0 items-center justify-between px-4 py-1.5 border-b border-black/5 dark:border-white/5">
              {posts.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setSelectedPostId(null)}
                  className="flex items-center gap-1 text-xs font-semibold text-primary transition hover:text-primary-hover"
                >
                  <ChevronLeft className="size-4" />
                  <span>All thoughts ({posts.length})</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center gap-1 text-xs font-semibold text-primary transition hover:text-primary-hover"
                >
                  <ChevronLeft className="size-4" />
                  <span>Back to map</span>
                </button>
              )}

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label={isExpanded ? "Collapse" : "Expand"}
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                >
                  {isExpanded ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
                </button>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={onClose}
                  className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Post Content */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {/* Cover Image if available */}
              {signedImageUrl && (
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-black/10 bg-muted dark:border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={signedImageUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                </div>
              )}
              {activePost.imagePath && !signedImageUrl && (
                <Skeleton className="aspect-video w-full rounded-2xl" />
              )}

              {/* Timestamp & Location badge */}
              <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock3 className="size-3" />
                  {relativeTime(activePost.createdAt)}
                </span>
                <span className="truncate max-w-[200px] flex items-center gap-1 text-primary">
                  <MapPin className="size-3 shrink-0" />
                  <span className="truncate">{placeName}</span>
                </span>
              </div>

              {/* Title & Body */}
              <div>
                <h2 className="font-serif text-lg font-bold leading-snug tracking-tight text-foreground">
                  {activePost.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap">
                  {activePost.moderationStatus === "flagged"
                    ? "This post was flagged for review."
                    : activePost.text}
                </p>
              </div>

              {/* Music Preview Card */}
              {activePost.music && (
                <div className="pt-1">
                  <MusicPreviewCard music={activePost.music} />
                </div>
              )}

              {/* Action Buttons Row */}
              <div className="flex items-center gap-2 pt-2 border-t border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={onCreatePost}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-primary py-2 text-xs font-semibold text-primary-foreground shadow-sm transition active:scale-98"
                >
                  <Plus className="size-3.5" /> Add thought here
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyPostLink(activePost)}
                  className="flex size-9 items-center justify-center rounded-full border border-black/10 bg-background text-foreground shadow-xs transition hover:bg-muted active:scale-95 dark:border-white/10"
                  aria-label="Copy thought link"
                >
                  <Share2 className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleOpenGoogleMaps}
                  className="flex size-9 items-center justify-center rounded-full border border-black/10 bg-background text-foreground shadow-xs transition hover:bg-muted active:scale-95 dark:border-white/10"
                  aria-label="Google Maps"
                >
                  <ExternalLink className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── CASE 3: Multi-Post Feed List ───────────────────────── */
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* Header Navigation */}
            <div className="flex shrink-0 items-center justify-between px-4 py-1.5 border-b border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1 text-xs font-semibold text-primary transition hover:text-primary-hover"
              >
                <ChevronLeft className="size-4" />
                <span>Back to map</span>
              </button>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label={isExpanded ? "Collapse" : "Expand"}
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                >
                  {isExpanded ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
                </button>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={onClose}
                  className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Place Info */}
            <div className="px-4 pt-2 pb-1 shrink-0">
              <h2 className="truncate font-serif text-lg font-bold tracking-tight text-foreground">
                {placeName}
              </h2>
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  <Sparkles className="size-3" />
                  {posts.length} thoughts pinned here
                </span>
              </div>

              {/* Action Buttons Row */}
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onCreatePost}
                  className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition active:scale-95"
                >
                  <Plus className="size-3.5" /> Add thought
                </button>
                <button
                  type="button"
                  onClick={handleCopyPlaceLink}
                  className="flex items-center gap-1.5 rounded-full border border-black/10 bg-background px-3 py-1.5 text-xs font-medium text-foreground/90 shadow-xs transition hover:bg-muted active:scale-95 dark:border-white/10"
                >
                  <Copy className="size-3.5" /> Copy link
                </button>
                <button
                  type="button"
                  onClick={handleOpenGoogleMaps}
                  className="flex items-center gap-1.5 rounded-full border border-black/10 bg-background px-3 py-1.5 text-xs font-medium text-foreground/90 shadow-xs transition hover:bg-muted active:scale-95 dark:border-white/10"
                >
                  <ExternalLink className="size-3.5" /> Maps
                </button>
              </div>
            </div>

            {/* Scrollable Thoughts List */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Select a thought to read
              </p>
              <PostClusterList
                posts={posts}
                limit={isExpanded ? posts.length : 12}
                onSelect={(post) => setSelectedPostId(post.id)}
              />
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
