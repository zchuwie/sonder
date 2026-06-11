import Link from "next/link";
import { Clock3, Flag, MapPin, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { relativeTime } from "@/features/posts/lib/post-utils";
import type { AnonymousPost } from "@/features/posts/lib/post-types";
import { MusicPreviewCard } from "./MusicPreviewCard";

export function PublicPostView({ post }: { post: AnonymousPost }) {
  return (
    <main className="min-h-dvh bg-muted/50 px-4 py-8 sm:py-14">
      <div className="mx-auto mb-5 flex max-w-2xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-primary"><MapPin className="size-5" /> Sonder</Link>
        <Button asChild className="rounded-xl"><Link href="/">Explore map</Link></Button>
      </div>
      <Card className="mx-auto max-w-2xl gap-0 overflow-hidden rounded-3xl border-white/70 p-0 shadow-xl">
        <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-primary/20 via-muted to-background">
          {post.imageUrl && post.moderationStatus !== "flagged" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.imageUrl} alt="" className="size-full object-cover" />
          ) : post.music?.coverUrl && post.moderationStatus !== "flagged" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.music.coverUrl} alt="" className="absolute left-1/2 top-1/2 size-36 -translate-x-1/2 -translate-y-1/2 rounded-3xl object-cover shadow-xl" />
          ) : <div className="grid size-full place-items-center text-sm text-muted-foreground">An anonymous thought</div>}
        </div>
        <div className="space-y-5 p-6 sm:p-8">
          <div className="flex flex-wrap gap-2"><Badge variant="secondary">Anonymous</Badge><Badge variant="outline"><ShieldCheck /> Public thought</Badge></div>
          <h1 className="text-2xl font-semibold leading-tight">{post.title}</h1>
          <p className="text-base leading-7">{post.moderationStatus === "flagged" ? "This post was flagged for review." : post.text}</p>
          {post.music && <MusicPreviewCard music={post.music} />}
          <div className="grid gap-3 rounded-2xl border bg-muted/40 p-4 text-sm text-muted-foreground sm:grid-cols-2">
            <span className="flex items-center gap-2"><MapPin className="size-4" /> {post.placeName ?? "Pinned nearby"}</span>
            <span className="flex items-center gap-2"><Clock3 className="size-4" /> {relativeTime(post.createdAt)}</span>
          </div>
          <Button variant="ghost" className="rounded-xl text-muted-foreground"><Flag /> Report post</Button>
        </div>
      </Card>
    </main>
  );
}
