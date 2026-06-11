"use client";

import { Clock3, Music2 } from "lucide-react";
import { relativeTime } from "@/features/posts/lib/post-utils";
import type { AnonymousPost } from "@/features/posts/lib/post-types";

export function PostClusterList({ posts, onSelect, limit = 3 }: { posts: AnonymousPost[]; onSelect: (post: AnonymousPost) => void; limit?: number }) {
  return (
    <div className="space-y-2">
      {posts.filter((post) => post.moderationStatus !== "hidden").slice(0, limit).map((post, index) => (
        <button key={post.id} type="button" onClick={() => onSelect(post)} className="flex w-full items-start gap-3 rounded-2xl bg-muted/55 p-3 text-left transition hover:bg-muted">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">{index + 1}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold">{post.title}</span>
            <span className="mt-0.5 line-clamp-1 text-[11px] leading-5 text-muted-foreground">{post.moderationStatus === "flagged" ? "This post was flagged for review." : post.text}</span>
            <span className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">{post.music && <Music2 className="size-3" />}<Clock3 className="size-3" /> {relativeTime(post.createdAt)}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
