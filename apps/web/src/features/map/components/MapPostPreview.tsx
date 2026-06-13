"use client";

import { MapPin, Plus, X } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import type { MarkerData } from "@/features/posts/lib/post-types";
import { PostClusterList } from "@/features/posts/components/PostClusterList";

export function MapPostPreview({
  marker,
  position,
  onClose,
  onCreatePost,
  onViewGroup,
}: {
  marker: MarkerData;
  position: { x: number; y: number };
  onClose: () => void;
  onCreatePost: () => void;
  onViewGroup: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const posts = marker.posts.filter((item) => item.moderationStatus !== "hidden");

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
      <div className="space-y-4">
        <div>
          <p className="flex items-center gap-1.5 pr-8 text-xs font-semibold text-primary"><MapPin className="size-3.5" /> {marker.placeName ?? "Selected place"}</p>
          <p className="mt-2 text-sm font-medium">{posts.length ? `${posts.length} ${posts.length === 1 ? "thought" : "thoughts"} pinned here` : "No thoughts pinned here yet"}</p>
        </div>
        {posts.length > 0 && <PostClusterList posts={posts} limit={2} onSelect={onViewGroup} />}
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline" className="rounded-xl" onClick={onCreatePost}><Plus /> Leave thought</Button>
          <Button size="sm" className="rounded-xl" onClick={onViewGroup} disabled={!posts.length}>View details</Button>
        </div>
      </div>
      <span className="absolute bottom-[-7px] left-1/2 size-4 -translate-x-1/2 rotate-45 border-b border-r bg-background" />
      </motion.div>
    </motion.div>
  );
}
