"use client";

import { Clock3, ImageIcon, Leaf, Music2, ShieldCheck, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/features/posts/lib/post-utils";
import type { AnonymousPost } from "@/features/posts/lib/post-types";

export function AnonymousPostCard({
  post,
  selected,
  onClick,
}: {
  post: AnonymousPost;
  selected?: boolean;
  onClick?: () => void;
}) {
  const flagged = post.moderationStatus === "flagged";

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => event.key === "Enter" && onClick?.()}
      className={cn(
        "group flex h-full min-h-[320px] cursor-pointer flex-col gap-0 overflow-hidden rounded-2xl border-primary/10 bg-background/95 p-0 shadow-[0_12px_34px_rgba(18,70,35,.08)] transition-[transform,box-shadow,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(18,70,35,.14)] focus-visible:ring-2 focus-visible:ring-primary sm:min-h-[390px] sm:rounded-3xl",
        selected && "ring-2 ring-primary",
      )}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-primary/15 via-primary/5 to-muted">
        {post.imageUrl && !flagged ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.imageUrl} alt="" className="size-full object-cover" />
        ) : post.music?.coverUrl && !flagged ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.music.coverUrl} alt="" className="size-full scale-110 object-cover blur-xl opacity-35" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={post.music.coverUrl} alt="" className="absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-2xl object-cover shadow-xl" />
          </>
        ) : (
          <div className="grid size-full place-items-center text-primary"><div className="grid size-16 place-items-center rounded-full bg-background/70 shadow-sm backdrop-blur"><Leaf className="size-7" /></div></div>
        )}
        <span className="absolute bottom-3 left-3 rounded-full bg-background/85 px-2.5 py-1 text-[10px] font-semibold text-primary shadow-sm backdrop-blur">
          {post.imageUrl ? "Photo thought" : post.music ? "Song thought" : "Written thought"}
        </span>
      </div>
      <div className="flex flex-1 flex-col space-y-3 p-4 sm:space-y-4 sm:p-5">
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <Badge variant="secondary" className="rounded-full">
            Anonymous
          </Badge>
          {post.imageUrl && <Badge variant="outline"><ImageIcon /> Photo</Badge>}
          {post.music && <Badge variant="outline"><Music2 /> Song</Badge>}
          {post.moderationStatus === "pending" && (
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
              <ShieldCheck /> Pending review
            </Badge>
          )}
          {flagged && (
            <Badge variant="destructive"><TriangleAlert /> Flagged</Badge>
          )}
        </div>
        <div>
          <h3 className="line-clamp-1 text-base font-semibold leading-6">{post.title}</h3>
          <p className={cn("mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground", flagged && "text-muted-foreground")}>
          {flagged ? "This post was flagged for review." : post.text || "An anonymous moment was left here."}
          </p>
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-primary/10 pt-3 text-xs text-muted-foreground sm:pt-4">
          <span className="truncate">{post.placeName ?? "Pinned nearby"}</span>
          <span className="flex shrink-0 items-center gap-1">
            <Clock3 className="size-3" /> {relativeTime(post.createdAt)}
          </span>
        </div>
      </div>
    </Card>
  );
}
