import Link from "next/link";
import { Clock3, MapPin, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { relativeTime } from "@/features/posts/lib/post-utils";
import type { AnonymousPost } from "@/features/posts/lib/post-types";
import { MusicPreviewCard } from "./MusicPreviewCard";
import { SharedPostMap } from "@/features/map/components/SharedPostMap";

export function PublicPostView({ post }: { post: AnonymousPost }) {
  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-muted">
      <SharedPostMap post={post} />
      <div className="pointer-events-none absolute left-0 top-0 z-20 p-2 sm:p-5">
        <div className="pointer-events-auto flex w-fit max-w-[26vw] items-center gap-2 rounded-xl border border-black/10 bg-background/95 px-2.5 py-2 shadow-lg backdrop-blur-xl sm:max-w-none sm:rounded-2xl sm:px-3">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-primary"
          >
            <MapPin className="size-4 shrink-0 sm:size-5" />
            <span className="hidden sm:inline">Sonder</span>
          </Link>
          <span className="hidden h-5 w-px bg-border sm:block" />
          <span className="hidden max-w-72 truncate text-xs text-muted-foreground sm:block">
            {post.placeName ?? `${post.lat.toFixed(4)}, ${post.lng.toFixed(4)}`}
          </span>
        </div>
      </div>
      <Card
        data-shared-post-panel
        className="absolute inset-x-2 bottom-2 z-20 max-h-[48dvh] gap-0 overflow-y-auto rounded-2xl border-black/10 bg-background/96 p-0 shadow-2xl backdrop-blur-xl sm:inset-x-auto sm:bottom-4 sm:right-4 sm:top-4 sm:max-h-none sm:w-[24rem] sm:rounded-3xl lg:w-[27rem]"
      >
        <div className="relative hidden aspect-[16/9] overflow-hidden bg-gradient-to-br from-primary/20 via-muted to-background sm:block">
          {post.imageUrl && post.moderationStatus !== "flagged" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.imageUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : post.music?.coverUrl && post.moderationStatus !== "flagged" ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.music.coverUrl}
                alt=""
                className="size-full scale-110 object-cover opacity-30 blur-xl"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.music.coverUrl}
                alt=""
                className="absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-2xl object-cover shadow-xl sm:size-36 sm:rounded-3xl"
              />
            </>
          ) : (
            <div className="grid size-full place-items-center text-sm text-muted-foreground">
              An anonymous thought
            </div>
          )}
        </div>
        <div className="space-y-3 p-3 sm:space-y-5 sm:p-6">
          <div className="mx-auto h-1 w-10 rounded-full bg-border sm:hidden" />
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <Badge variant="secondary">Anonymous</Badge>
            <Badge variant="outline">
              <ShieldCheck />{" "}
              <span className="hidden min-[380px]:inline">Public thought</span>
              <span className="min-[380px]:hidden">Public</span>
            </Badge>
          </div>
          <h1 className="text-lg font-semibold leading-tight sm:text-2xl">
            {post.title}
          </h1>
          <p className="text-sm leading-6 sm:text-base sm:leading-7">
            {post.moderationStatus === "flagged"
              ? "This post was flagged for review."
              : post.text}
          </p>
          {post.music && <MusicPreviewCard music={post.music} />}
          <div className="grid gap-2 rounded-xl border bg-muted/40 p-2.5 text-[11px] text-muted-foreground sm:rounded-2xl sm:p-3 sm:text-sm">
            <span className="flex items-center gap-2">
              <MapPin className="size-4" /> {post.placeName ?? "Pinned nearby"}
            </span>
            <span className="flex items-center gap-2 font-mono text-[9px] sm:text-[10px]">
              {post.lat.toFixed(5)}, {post.lng.toFixed(5)}
            </span>
            <span className="flex items-center gap-2">
              <Clock3 className="size-4" /> {relativeTime(post.createdAt)}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 border-t pt-3 sm:flex sm:flex-wrap">
            <Button asChild className="w-full rounded-xl sm:ml-auto sm:w-auto">
              <Link href="/map">Explore map</Link>
            </Button>
          </div>
        </div>
      </Card>
    </main>
  );
}
