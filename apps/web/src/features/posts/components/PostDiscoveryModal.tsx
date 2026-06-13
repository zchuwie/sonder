"use client";

import { useMemo, useState } from "react";
import { MapPin, Search, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnonymousPostCard } from "./AnonymousPostCard";
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
  const [filter, setFilter] = useState("all");
  const filtered = useMemo(
    () =>
      posts.filter((post) => {
        if (filter === "photo" && !post.imageUrl) return false;
        if (filter === "song" && !post.music) return false;
        return `${post.title} ${post.text} ${post.placeName}`.toLowerCase().includes(query.toLowerCase());
      }),
    [filter, posts, query],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] gap-0 overflow-hidden rounded-3xl border-primary/15 bg-background/95 p-0 shadow-[0_30px_90px_rgba(18,70,35,.24)] backdrop-blur-xl sm:max-w-3xl">
        <DialogHeader className="border-b px-6 py-5 pr-14">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="size-5 text-primary" /> Thoughts in this map area
          </DialogTitle>
          <DialogDescription>Approved thoughts visible in your current map preview, nearest first.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 border-b px-6 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search thoughts or places..." className="h-11 rounded-xl pl-9" />
          </div>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="w-full rounded-xl">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="photo">Photos</TabsTrigger>
              <TabsTrigger value="song">Songs</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="grid max-h-[60vh] gap-5 overflow-y-auto p-6 sm:grid-cols-2">
          {filtered.length ? filtered.map((post) => (
            <AnonymousPostCard key={post.id} post={post} onClick={() => onSelectPost(post)} />
          )) : (
            <div className="col-span-full flex flex-col items-center gap-3 py-14 text-center text-muted-foreground">
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
