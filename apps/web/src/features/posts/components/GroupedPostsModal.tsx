"use client";

import { MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AnonymousPostCard } from "./AnonymousPostCard";
import type { AnonymousPost, MarkerData } from "@/features/posts/lib/post-types";

export function GroupedPostsModal({ marker, open, onOpenChange, onSelectPost }: { marker: MarkerData | null; open: boolean; onOpenChange: (open: boolean) => void; onSelectPost: (post: AnonymousPost) => void }) {
  if (!marker) return null;
  const posts = marker.posts.filter((post) => post.moderationStatus !== "hidden");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] gap-0 overflow-hidden rounded-[30px] border-primary/15 bg-background/96 p-0 shadow-[0_30px_90px_rgba(18,70,35,.24)] backdrop-blur-xl sm:max-w-3xl">
        <DialogHeader className="border-b px-6 py-5 pr-14 text-left">
          <DialogTitle className="flex items-center gap-2 text-lg"><MapPin className="size-5 text-primary" /> {marker.placeName ?? "Thoughts pinned here"}</DialogTitle>
          <DialogDescription>{posts.length} {posts.length === 1 ? "anonymous thought" : "anonymous thoughts"} pinned around this place.</DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[68vh] gap-4 overflow-y-auto p-5 sm:grid-cols-2">
          {posts.map((post) => <AnonymousPostCard key={post.id} post={post} onClick={() => onSelectPost(post)} />)}
        </div>
      </DialogContent>
    </Dialog>
  );
}
