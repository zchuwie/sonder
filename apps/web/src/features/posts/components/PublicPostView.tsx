"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock3, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { relativeTime } from "@/features/posts/lib/post-utils";
import type { AnonymousPost } from "@/features/posts/lib/post-types";
import { MusicPreviewCard } from "./MusicPreviewCard";
import { SharedPostMap } from "@/features/map/components/SharedPostMap";
import { fetchSignedPostImageUrl } from "@/lib/storage/image-url";
import { Skeleton } from "@/components/ui/skeleton";

export function PublicPostView({ post }: { post: AnonymousPost }) {
  const [signedUrl, setSignedUrl] = useState<string | null>(post.imageUrl ?? null);
  const flagged = post.moderationStatus === "flagged";

  useEffect(() => {
    if (!signedUrl && post.imagePath) {
      void fetchSignedPostImageUrl(post.id).then(url => {
        if (url) setSignedUrl(url);
      });
    }
  }, [post.id, post.imagePath, signedUrl]);

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-muted">
      <SharedPostMap post={post} />
      <div className="pointer-events-none absolute left-0 top-0 z-20 p-2 sm:p-5">
        <div className="pointer-events-auto flex w-fit items-center gap-2 rounded-xl border border-black/10 bg-background/95 px-2.5 py-2 shadow-lg backdrop-blur-xl sm:rounded-2xl sm:px-3">
          <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
            <MapPin className="size-4 shrink-0 sm:size-5" />
            <span className="hidden sm:inline">Sonder</span>
          </Link>
          <span className="h-5 w-px bg-border" />
          <span className="max-w-72 truncate text-xs text-muted-foreground">
            {post.placeName ?? `${post.lat.toFixed(4)}, ${post.lng.toFixed(4)}`}
          </span>
        </div>
      </div>
      
      <div
        data-shared-post-panel
        className="pointer-events-auto absolute inset-x-2 bottom-2 top-auto z-20 flex w-auto max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-2xl border border-black/10 bg-background/96 p-0 shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:bottom-auto sm:left-auto sm:right-10 sm:top-1/2 sm:max-h-[78dvh] sm:w-[26rem] sm:-translate-y-1/2 sm:rounded-3xl lg:right-20"
      >
        {/* Cover */}
          {signedUrl && !flagged ? (
            <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-t-2xl sm:aspect-video sm:h-auto sm:rounded-t-3xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={signedUrl} alt="" className="size-full object-cover" />
            </div>
          ) : post.imagePath && !signedUrl && !flagged ? (
            <Skeleton className="h-28 w-full shrink-0 rounded-t-2xl sm:aspect-video sm:h-auto sm:rounded-t-3xl" />
          ) : post.music?.coverUrl && !flagged ? (
            <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-t-2xl bg-linear-to-br from-primary/20 via-muted to-background sm:aspect-video sm:h-auto sm:rounded-t-3xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.music.coverUrl} alt="" className="size-full scale-110 object-cover opacity-30 blur-xl" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.music.coverUrl} alt="" className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-xl object-cover shadow-xl sm:size-32 sm:rounded-3xl" />
            </div>
          ) : null}

          {/* Content */}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 sm:p-6">
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground sm:text-xs">
              <Clock3 className="size-3" /> {relativeTime(post.createdAt)}
            </span>
            <div className="mt-1.5 space-y-1 text-left sm:mt-2 sm:space-y-2">
              <h1 className="font-serif text-lg font-normal leading-snug tracking-[-0.01em] sm:text-2xl">
                {post.title}
              </h1>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground/80 sm:mt-3 sm:text-[15px] sm:leading-7">
              {flagged ? "This post was flagged for review." : post.text}
            </p>
            {post.music && !flagged && <div className="mt-4"><MusicPreviewCard music={post.music} /></div>}
          </div>

          {/* Bottom Bar */}
          <div className="flex shrink-0 items-center justify-between border-t border-border/50 bg-background/95 px-4 py-3 backdrop-blur-sm sm:px-6">
            <Button asChild className="w-full rounded-xl">
              <Link href={`/map?post=${post.id}`}>Explore map</Link>
            </Button>
          </div>
      </div>
    </main>
  );
}
