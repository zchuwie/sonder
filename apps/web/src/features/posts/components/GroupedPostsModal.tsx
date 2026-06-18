"use client";

import { MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AnonymousPostCard } from "./AnonymousPostCard";
import type { AnonymousPost, MarkerData } from "@/features/posts/lib/post-types";

export function GroupedPostsModal({ marker, open, onOpenChange, onSelectPost }: { marker: MarkerData | null; open: boolean; onOpenChange: (open: boolean) => void; onSelectPost: (post: AnonymousPost) => void }) {
  if (!marker) return null;
  const posts = marker.posts;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-none gap-0 overflow-hidden rounded-2xl border-primary/15 bg-background/96 p-0 shadow-[0_30px_90px_rgba(18,70,35,.24)] backdrop-blur-xl sm:max-h-[88dvh] sm:w-full sm:max-w-3xl sm:rounded-[30px]">
        <DialogHeader className="border-b px-4 py-4 pr-12 text-left sm:px-6 sm:py-5 sm:pr-14">
          <DialogTitle className="flex items-center gap-2 text-lg"><MapPin className="size-5 text-primary" /> {marker.placeName ?? "Thoughts pinned here"}</DialogTitle>
          <DialogDescription>{posts.length} {posts.length === 1 ? "anonymous thought" : "anonymous thoughts"} pinned around this place.</DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[calc(100dvh-8rem)] gap-3 overflow-y-auto p-3 sm:max-h-[68vh] sm:grid-cols-2 sm:gap-4 sm:p-5">
          {posts.map((post) => <AnonymousPostCard key={post.id} post={post} onClick={() => onSelectPost(post)} />)}
        </div>
      </DialogContent>
    </Dialog>
  );
}
