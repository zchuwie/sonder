"use client";

import { useMemo, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PostClusterList } from "./PostClusterList";
import type { AnonymousPost } from "@/features/posts/lib/post-types";

export function PostDiscoveryModal({
  open,
  posts,
  onOpenChange,
  onSelectPost,
}: {
  open: boolean;
  posts: AnonymousPost[];
  onOpenChange: (open: boolean) => void;
  onSelectPost: (post: AnonymousPost) => void;
}) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ text: true, photo: true, song: true });
  const [visibleCount, setVisibleCount] = useState(20);

  const toggleFilter = (key: keyof typeof filters) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // Prevent unchecking all
      if (!next.text && !next.photo && !next.song) return prev;
      return next;
    });
    setVisibleCount(20);
  };

  const filtered = useMemo(
    () =>
      posts.filter((post) => {
        let typeMatch = false;
        if (filters.text && !post.imageUrl && !post.music) typeMatch = true;
        if (filters.photo && post.imageUrl) typeMatch = true;
        if (filters.song && post.music) typeMatch = true;
        if (!typeMatch) return false;

        return `${post.title} ${post.text} ${post.placeName}`.toLowerCase().includes(query.toLowerCase());
      }),
    [filters, posts, query],
  );

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const bottom = e.currentTarget.scrollHeight - e.currentTarget.scrollTop <= e.currentTarget.clientHeight + 400;
    if (bottom && visibleCount < filtered.length) {
      setVisibleCount((prev) => prev + 20);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-none gap-0 overflow-hidden rounded-2xl border-primary/15 bg-background/95 p-0 shadow-[0_30px_90px_rgba(18,70,35,.24)] backdrop-blur-xl sm:max-h-[88dvh] sm:w-full sm:max-w-3xl sm:rounded-3xl">
        <DialogHeader className="border-b px-4 py-4 pr-12 sm:px-6 sm:py-5 sm:pr-14">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <MapPin className="size-5 text-primary" /> Thoughts in this map area
          </DialogTitle>
          <DialogDescription>Approved thoughts visible in your current map preview, nearest first.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 border-b px-4 py-3 sm:space-y-4 sm:px-6 sm:py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => { setQuery(event.target.value); setVisibleCount(20); }} placeholder="Search thoughts or places..." className="h-11 rounded-xl pl-9" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(["text", "photo", "song"] as const).map((key) => {
              const labels = { text: "Text", photo: "Photos", song: "Songs" };
              const checked = filters[key];
              return (
                <button
                  key={key}
                  onClick={() => toggleFilter(key)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                    checked
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {checked && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {labels[key]}
                </button>
              );
            })}
          </div>
        </div>
        <div className="max-h-[calc(100dvh-13.5rem)] overflow-y-auto p-3 pb-8 sm:max-h-[60vh] sm:p-6 sm:pb-8" onScroll={handleScroll}>
          {filtered.length ? (
            <PostClusterList posts={filtered} limit={visibleCount} onSelect={(post) => onSelectPost(post)} />
          ) : (
            <div className="flex flex-col items-center gap-3 py-14 text-center text-muted-foreground">
              <MapPin className="size-8" />
              <p className="text-sm font-medium text-foreground">No thoughts match this search.</p>
              <p className="text-xs">Try another place or filter.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
