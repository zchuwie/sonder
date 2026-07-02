"use client";

import { MapPin, X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { MarkerData } from "@/features/posts/lib/post-types";
import { PostClusterList } from "@/features/posts/components/PostClusterList";
import { relativeTime } from "@/features/posts/lib/post-utils";

export function MapPostPreview({
  marker,
  position,
  onClose,
  onCreatePost,
  onViewGroup,
  onSelectPost,
}: {
  marker: MarkerData;
  position: { x: number; y: number };
  onClose: () => void;
  onCreatePost: () => void;
  onViewGroup: () => void;
  onSelectPost?: (post: MarkerData["posts"][number]) => void;
}) {
  const reduceMotion = useReducedMotion();
  const posts = marker.posts;

  return (
    <motion.div
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0.01 : 0.18 }}
      className="absolute z-20 hidden w-80 -translate-x-1/2 -translate-y-[calc(100%+18px)] sm:block"
      style={{ left: position.x, top: position.y }}
    >
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: reduceMotion ? 0.01 : 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-[28px] border border-black/10 bg-background/95 p-4 shadow-[0_24px_64px_rgba(18,70,35,.2)] backdrop-blur-xl"
      >
      <Button variant="secondary" size="icon-sm" className="absolute right-2 top-2 rounded-full" onClick={onClose} aria-label="Close preview">
        <X />
      </Button>
      <div className="space-y-3">
        <div>
          <p className="flex items-center gap-1.5 pr-8 text-xs font-semibold text-primary"><MapPin className="size-3.5" /> {marker.placeName ?? "Selected place"}</p>
        </div>

        {posts.length === 1 ? (
          /* Single post — show directly, click to open detail */
          <button
            type="button"
            className="w-full rounded-xl bg-muted/50 p-3 text-left transition hover:bg-muted"
            onClick={() => onSelectPost?.(posts[0]!)}
          >
            <p className="text-sm font-semibold">{posts[0]!.title}</p>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{posts[0]!.text}</p>
            <p className="mt-1.5 text-[10px] text-muted-foreground">{relativeTime(posts[0]!.createdAt)}</p>
          </button>
        ) : posts.length > 1 ? (
          /* Multiple posts — scrollable list */
          <>
            <p className="text-sm font-medium">{posts.length} thoughts pinned here</p>
            <div className="max-h-[220px] overflow-y-auto pr-1 pb-1 -mr-1">
              <PostClusterList posts={posts} limit={posts.length} onSelect={(post) => onSelectPost?.(post)} />
            </div>
          </>
        ) : (
          /* No posts */
          <>
            <p className="text-sm text-muted-foreground">No thoughts pinned here yet.</p>
          </>
        )}
      </div>
      <span className="absolute bottom-[-7px] left-1/2 size-4 -translate-x-1/2 rotate-45 border-b border-r bg-background" />
      </motion.div>
    </motion.div>
  );
}
