"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  X,
  Plus,
  Copy,
  Check,
  Download,
  Send,
  Sparkles,
  ExternalLink,
  MapPin,
  Clock3,
  ChevronUp,
  ChevronDown,
  ZoomOut,
} from "lucide-react";
import { toast } from "sonner";
import type { AnonymousPost, MarkerData } from "@/features/posts/lib/post-types";
import { relativeTime } from "@/features/posts/lib/post-utils";
import { PostClusterList } from "@/features/posts/components/PostClusterList";
import { MusicPreviewCard } from "@/features/posts/components/MusicPreviewCard";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchSignedPostImageUrl } from "@/lib/storage/image-url";
import { buildShareUrl } from "@/features/posts/components/PostDetailModal";
import { ShareCardModal } from "@/features/posts/components/ShareCardModal";

export function MapPlaceBottomSheet({
  marker,
  onClose,
  onCreatePost,
  onResetZoom,
}: {
  marker: MarkerData | null;
  onClose: () => void;
  onCreatePost: () => void;
  onResetZoom?: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [signedImageUrl, setSignedImageUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);

  // Reset selected post when marker changes
  useEffect(() => {
    setSelectedPostId(null);
    setIsExpanded(false);
    setShowCard(false);
    setShowImagePreview(false);
  }, [marker?.id]);

  // Handle ESC key for image preview overlay (ponytail: native listener, zero deps)
  useEffect(() => {
    if (!showImagePreview) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowImagePreview(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showImagePreview]);

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

  const handleCopyPostLink = async (post: AnonymousPost) => {
    try {
      const url = buildShareUrl(post);
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Thought link copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      handleCopyPlaceLink();
    }
  };

  const handleSendLink = async (post: AnonymousPost) => {
    let url = "";
    try {
      url = buildShareUrl(post);
    } catch {
      url = typeof window !== "undefined" ? `${window.location.origin}/map?marker=${encodeURIComponent(marker.id)}` : "";
    }
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.text,
          url,
        });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    await handleCopyPostLink(post);
  };

  const handleDownloadShareCard = () => {
    setShowCard(true);
  };

  const handleOpenGoogleMaps = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${marker.lat},${marker.lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <>
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
        // ponytail: expanded viewport heights (84dvh / 92dvh) accommodate larger media and comfortable reading
        className={`fixed inset-x-0 bottom-0 z-40 flex flex-col rounded-t-[28px] border-t border-black/10 bg-background/98 shadow-2xl backdrop-blur-2xl transition-[height] duration-200 dark:border-white/10 sm:hidden ${
          isExpanded ? "h-[92dvh]" : "h-auto max-h-[84dvh]"
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
          <div className="flex flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                <MapPin className="size-3.5" /> New thought location
              </span>
              <div className="flex items-center gap-1.5">
                {onResetZoom && (
                  <button
                    type="button"
                    aria-label="Zoom out to overview"
                    title="Zoom out to overview"
                    onClick={() => {
                      onResetZoom();
                      onClose();
                    }}
                    className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary transition hover:bg-primary/20 active:scale-95"
                  >
                    <ZoomOut className="size-4" />
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Close"
                  onClick={onClose}
                  className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted active:scale-95"
                >
                  <X className="size-4.5" />
                </button>
              </div>
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
            <div className="flex shrink-0 items-center justify-between px-4 py-2 border-b border-black/5 dark:border-white/5">
              {posts.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setSelectedPostId(null)}
                  className="flex items-center gap-1.5 py-1 text-xs font-semibold text-primary transition hover:text-primary-hover active:scale-95"
                >
                  <ChevronLeft className="size-4" />
                  <span>All thoughts ({posts.length})</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center gap-1.5 py-1 text-xs font-semibold text-primary transition hover:text-primary-hover active:scale-95"
                >
                  <ChevronLeft className="size-4" />
                  <span>Back to map</span>
                </button>
              )}

              <div className="flex items-center gap-1">
                {onResetZoom && (
                  <button
                    type="button"
                    aria-label="Zoom out to overview"
                    title="Zoom out to overview"
                    onClick={() => {
                      onResetZoom();
                      onClose();
                    }}
                    className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary transition hover:bg-primary/20 active:scale-95"
                  >
                    <ZoomOut className="size-4" />
                  </button>
                )}
                <button
                  type="button"
                  aria-label={isExpanded ? "Collapse" : "Expand"}
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted active:scale-95"
                >
                  {isExpanded ? <ChevronDown className="size-4.5" /> : <ChevronUp className="size-4.5" />}
                </button>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={onClose}
                  className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted active:scale-95"
                >
                  <X className="size-4.5" />
                </button>
              </div>
            </div>

            {/* Scrollable Post Content: Exact hierarchy requested (date, title, image, body, music) */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {/* 1. Date */}
              <div className="flex items-center justify-between gap-2 text-[13px] text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock3 className="size-4 text-muted-foreground/80" />
                  {relativeTime(activePost.createdAt)}
                </span>
                <span className="truncate max-w-[210px] flex items-center gap-1.5 text-primary font-medium">
                  <MapPin className="size-4 shrink-0 text-primary" />
                  <span className="truncate">{placeName}</span>
                </span>
              </div>

              {/* 2. Title */}
              <h2 className="font-serif text-2xl sm:text-[26px] font-bold leading-snug tracking-tight text-foreground">
                {activePost.title}
              </h2>

              {/* 3. Topic Content with Instant Photo Integration (ponytail: square, rounded, tilted instant photo with playful jump-and-shake animation) */}
              <div className="relative">
                {signedImageUrl && (
                  <motion.button
                    type="button"
                    onClick={() => setShowImagePreview(true)}
                    aria-label="View full picture"
                    // Playful jump and shake animation to entice tapping the photo (ponytail: native framer-motion keyframes)
                    animate={{
                      y: [0, 0, -10, -12, -2, 0, 0],
                      rotate: [-2, -2, -7, 6, -5, 3, -2],
                      scale: [1, 1, 1.05, 1.05, 1.02, 1, 1],
                    }}
                    transition={{
                      duration: 1.1,
                      ease: "easeInOut",
                      repeat: Infinity,
                      repeatDelay: 4.5,
                      delay: 0.8,
                    }}
                    whileHover={{ scale: 1.06, rotate: 0 }}
                    whileTap={{ scale: 0.94 }}
                    className={`group cursor-zoom-in text-left focus:outline-hidden ${
                      activePost.text ? "float-right ml-3.5 mb-2.5" : "inline-block my-1.5"
                    }`}
                  >
                    {/* Pure borderless image: square, rounded corners, tilted with jump-and-shake animation */}
                    <div className="relative size-32 sm:size-36 aspect-square overflow-hidden rounded-2xl shadow-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={signedImageUrl}
                        alt={activePost.title}
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  </motion.button>
                )}
                {activePost.imagePath && !signedImageUrl && (
                  <Skeleton className={`size-32 sm:size-36 rounded-2xl ${
                    activePost.text ? "float-right ml-3.5 mb-2.5" : "inline-block my-1.5"
                  }`} />
                )}

                {activePost.text && (
                  <p className="text-[17px] sm:text-lg leading-[1.65] text-foreground/90 whitespace-pre-wrap">
                    {activePost.moderationStatus === "flagged"
                      ? "This post was flagged for review."
                      : activePost.text}
                  </p>
                )}
                <div className="clear-both" />
              </div>

              {/* 5. Music */}
              {activePost.music && (
                <div className="pt-0.5">
                  <MusicPreviewCard music={activePost.music} />
                </div>
              )}

              {activePost.moderationStatus === "pending" && (
                <p className="text-center text-xs text-muted-foreground pt-1">Waiting for approval</p>
              )}
            </div>

            {/* Minimal Action Bar */}
            <div className="flex shrink-0 items-center justify-between border-t border-black/5 bg-background/95 px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur-sm dark:border-white/5">
              {/* Minimal Share Thought Button */}
              <button
                type="button"
                onClick={onCreatePost}
                className="flex items-center gap-1.5 rounded-full border border-black/10 bg-muted/50 px-3.5 py-2 text-xs font-medium text-foreground/80 transition hover:bg-muted hover:text-foreground active:scale-95 dark:border-white/10"
              >
                <Plus className="size-3.5 text-primary" />
                <span>Add thought</span>
              </button>

              {/* Minimal Action Buttons: Download share card, Copy link, Send link, Maps */}
              <div className="flex items-center gap-1.5">
                {/* Download share card */}
                <button
                  type="button"
                  aria-label="Download share card"
                  title="Download share card"
                  onClick={handleDownloadShareCard}
                  className="grid size-9 place-items-center rounded-full border border-black/10 bg-background text-muted-foreground shadow-xs transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary active:scale-95 dark:border-white/10"
                >
                  <Download className="size-4" />
                </button>

                {/* Copy link */}
                <button
                  type="button"
                  aria-label={copied ? "Link copied" : "Copy link"}
                  title={copied ? "Link copied" : "Copy link"}
                  onClick={() => handleCopyPostLink(activePost)}
                  className={`grid size-9 place-items-center rounded-full border border-black/10 bg-background text-muted-foreground shadow-xs transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary active:scale-95 dark:border-white/10 ${
                    copied ? "border-primary/40 text-primary bg-primary/10" : ""
                  }`}
                >
                  {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
                </button>

                {/* Send link */}
                <button
                  type="button"
                  aria-label="Send link"
                  title="Send link"
                  onClick={() => handleSendLink(activePost)}
                  className="grid size-9 place-items-center rounded-full border border-black/10 bg-background text-muted-foreground shadow-xs transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary active:scale-95 dark:border-white/10"
                >
                  <Send className="size-4" />
                </button>

                {/* Google Maps External Link */}
                <button
                  type="button"
                  aria-label="Open in Google Maps"
                  title="Open in Google Maps"
                  onClick={handleOpenGoogleMaps}
                  className="grid size-9 place-items-center rounded-full border border-black/10 bg-background text-muted-foreground shadow-xs transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary active:scale-95 dark:border-white/10"
                >
                  <ExternalLink className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── CASE 3: Multi-Post Feed List ───────────────────────── */
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {/* Header Navigation */}
            <div className="flex shrink-0 items-center justify-between px-4 py-2 border-b border-black/5 dark:border-white/5">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 py-1 text-xs font-semibold text-primary transition hover:text-primary-hover active:scale-95"
              >
                <ChevronLeft className="size-4" />
                <span>Back to map</span>
              </button>
              <div className="flex items-center gap-1">
                {onResetZoom && (
                  <button
                    type="button"
                    aria-label="Zoom out to overview"
                    title="Zoom out to overview"
                    onClick={() => {
                      onResetZoom();
                      onClose();
                    }}
                    className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary transition hover:bg-primary/20 active:scale-95"
                  >
                    <ZoomOut className="size-4" />
                  </button>
                )}
                <button
                  type="button"
                  aria-label={isExpanded ? "Collapse" : "Expand"}
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted active:scale-95"
                >
                  {isExpanded ? <ChevronDown className="size-4.5" /> : <ChevronUp className="size-4.5" />}
                </button>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={onClose}
                  className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted active:scale-95"
                >
                  <X className="size-4.5" />
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
                  className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition active:scale-95"
                >
                  <Plus className="size-3.5" /> Add thought
                </button>
                <button
                  type="button"
                  onClick={handleCopyPlaceLink}
                  className="flex items-center gap-1.5 rounded-full border border-black/10 bg-background px-3.5 py-2 text-xs font-medium text-foreground/90 shadow-xs transition hover:bg-muted active:scale-95 dark:border-white/10"
                >
                  <Copy className="size-3.5" /> Copy link
                </button>
                <button
                  type="button"
                  onClick={handleOpenGoogleMaps}
                  className="flex items-center gap-1.5 rounded-full border border-black/10 bg-background px-3.5 py-2 text-xs font-medium text-foreground/90 shadow-xs transition hover:bg-muted active:scale-95 dark:border-white/10"
                >
                  <ExternalLink className="size-3.5" /> Maps
                </button>
              </div>
            </div>

            {/* Scrollable Thoughts List */}
            <div className="flex-1 overflow-y-auto px-4 py-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
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
    {showCard && activePost && (
      <ShareCardModal post={activePost} onClose={() => setShowCard(false)} />
    )}
    {showImagePreview && signedImageUrl && activePost && (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Full size image preview"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
        onClick={() => setShowImagePreview(false)}
      >
        <button
          type="button"
          aria-label="Close image preview"
          onClick={() => setShowImagePreview(false)}
          className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition hover:bg-white/30 active:scale-95"
        >
          <X className="size-5" />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={signedImageUrl}
          alt={activePost.title}
          className="max-h-[85dvh] max-w-full rounded-2xl object-contain shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    )}
  </>
);
}
