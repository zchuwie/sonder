import Link from "next/link";
import { Clock3, Flag, MapPin, ShieldCheck } from "lucide-react";
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
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-3 sm:p-5">
        <div className="pointer-events-auto flex w-fit items-center gap-2 rounded-2xl border border-black/10 bg-background/95 px-3 py-2 shadow-lg backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
            <MapPin className="size-5" /> Sonder
          </Link>
          <span className="h-5 w-px bg-border" />
          <span className="max-w-40 truncate text-xs text-muted-foreground sm:max-w-72">
            {post.placeName ?? `${post.lat.toFixed(4)}, ${post.lng.toFixed(4)}`}
          </span>
        </div>
      </div>
      <Card
        data-shared-post-panel
        className="absolute bottom-2 right-2 top-16 z-20 w-[min(22rem,calc(100vw-4.5rem))] gap-0 overflow-y-auto rounded-2xl border-black/10 bg-background/96 p-0 shadow-2xl backdrop-blur-xl sm:bottom-4 sm:right-4 sm:top-4 sm:w-[24rem] sm:rounded-3xl lg:w-[27rem]"
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-primary/20 via-muted to-background">
          {post.imageUrl && post.moderationStatus !== "flagged" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.imageUrl} alt="" className="size-full object-cover" />
          ) : post.music?.coverUrl && post.moderationStatus !== "flagged" ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.music.coverUrl} alt="" className="size-full scale-110 object-cover opacity-30 blur-xl" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.music.coverUrl} alt="" className="absolute left-1/2 top-1/2 size-36 -translate-x-1/2 -translate-y-1/2 rounded-3xl object-cover shadow-xl" />
            </>
          ) : <div className="grid size-full place-items-center text-sm text-muted-foreground">An anonymous thought</div>}
        </div>
        <div className="space-y-4 p-4 sm:space-y-5 sm:p-6">
          <div className="flex flex-wrap gap-2"><Badge variant="secondary">Anonymous</Badge><Badge variant="outline"><ShieldCheck /> Public thought</Badge></div>
          <h1 className="text-xl font-semibold leading-tight sm:text-2xl">{post.title}</h1>
          <p className="text-sm leading-6 sm:text-base sm:leading-7">{post.moderationStatus === "flagged" ? "This post was flagged for review." : post.text}</p>
          {post.music && <MusicPreviewCard music={post.music} />}
          <div className="grid gap-2 rounded-2xl border bg-muted/40 p-3 text-xs text-muted-foreground sm:text-sm">
            <span className="flex items-center gap-2"><MapPin className="size-4" /> {post.placeName ?? "Pinned nearby"}</span>
            <span className="flex items-center gap-2 font-mono text-[10px]">{post.lat.toFixed(5)}, {post.lng.toFixed(5)}</span>
            <span className="flex items-center gap-2"><Clock3 className="size-4" /> {relativeTime(post.createdAt)}</span>
          </div>
          <div className="flex flex-wrap gap-2 border-t pt-3">
            <Button variant="ghost" className="rounded-xl text-muted-foreground"><Flag /> Report post</Button>
            <Button asChild className="ml-auto rounded-xl"><Link href="/map">Explore map</Link></Button>
          </div>
        </div>
      </Card>
    </main>
  );
}
