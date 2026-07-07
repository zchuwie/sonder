"use client";

import { useEffect, useState } from "react";
import { Clock3, Leaf, Music2 } from "lucide-react";
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
          for (const id of toFetch) {
            next.set(id, res.get(id) ?? "");
          }
          return next;
        });
      });
    }
  }, [posts, limit, signedUrls]);

  return (
    <div className="space-y-2">
      {posts.slice(0, limit).map((post) => {
        if (!post) return null;
        const url = post.imageUrl || signedUrls.get(post.id);
        return (
          <button key={post.id} type="button" onClick={() => onSelect({ ...post, imageUrl: url ?? post.imageUrl })} className="flex w-full items-center gap-2.5 rounded-2xl border border-black/5 bg-muted/80 p-2.5 text-left transition-[transform,background-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:bg-muted hover:shadow-sm">
            {url && post.moderationStatus !== "flagged" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="size-10 shrink-0 rounded-lg object-cover" />
            ) : post.imagePath && post.moderationStatus !== "flagged" ? (
              <Skeleton className="size-10 shrink-0 rounded-lg" />
            ) : post.music && post.moderationStatus !== "flagged" ? (
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Music2 className="size-5" />
              </div>
            ) : (
              <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Leaf className="size-5" />
              </div>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold">{post.title}</span>
              <span className="mt-0.5 line-clamp-1 text-[11px] leading-5 text-muted-foreground">{post.moderationStatus === "flagged" ? "This post was flagged for review." : post.text}</span>
              <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground">
                {post.music && (
                  <span className="flex items-center gap-1">
                    <Music2 className="size-3" />
                    <span className="truncate max-w-[100px] sm:max-w-[150px]">{post.music.title}</span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock3 className="size-3" /> {relativeTime(post.createdAt)}
                </span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
