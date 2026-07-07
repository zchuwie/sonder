"use client";

import { useEffect, useState } from "react";
import { Clock3, Music2 } from "lucide-react";
import { relativeTime } from "@/features/posts/lib/post-utils";
import type { AnonymousPost } from "@/features/posts/lib/post-types";
import { fetchSignedPostImageUrls } from "@/lib/storage/image-url";
import { Skeleton } from "@/components/ui/skeleton";

export function PostClusterList({ posts, onSelect, limit = 3 }: { posts: AnonymousPost[]; onSelect: (post: AnonymousPost) => void; limit?: number }) {
  const [signedUrls, setSignedUrls] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const toFetch = posts.slice(0, limit).filter(p => !p.imageUrl && p.imagePath && !signedUrls.has(p.id)).map(p => p.id);
    if (toFetch.length > 0) {
      void fetchSignedPostImageUrls(toFetch).then(res => {
        setSignedUrls(prev => {
          const next = new Map(prev);
          for (const [id, url] of res.entries()) {
            next.set(id, url);
          }
          return next;
        });
      });
    }
  }, [posts, limit, signedUrls]);

  return (
    <div className="space-y-2">
      {posts.slice(0, limit).map((post, index) => {
        if (!post) return null;
        const url = post.imageUrl || signedUrls.get(post.id);
        return (
          <button key={post.id} type="button" onClick={() => onSelect({ ...post, imageUrl: url ?? post.imageUrl })} className="flex w-full items-center gap-3 rounded-2xl border border-black/5 bg-muted/80 p-3 text-left transition-[transform,background-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:bg-muted hover:shadow-sm">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">{index + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold">{post.title}</span>
              <span className="mt-0.5 line-clamp-1 text-[11px] leading-5 text-muted-foreground">{post.moderationStatus === "flagged" ? "This post was flagged for review." : post.text}</span>
              <span className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">{post.music && <Music2 className="size-3" />}<Clock3 className="size-3" /> {relativeTime(post.createdAt)}</span>
            </span>
            {url && post.moderationStatus !== "flagged" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="size-10 shrink-0 rounded-lg object-cover" />
            ) : post.imagePath && post.moderationStatus !== "flagged" ? (
              <Skeleton className="size-10 shrink-0 rounded-lg" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
