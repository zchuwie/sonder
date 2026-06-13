"use client";

import { ExternalLink, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AudioPreviewButton } from "@/features/music/components/AudioPreviewButton";
import type { Music } from "@/features/posts/lib/post-types";

export function MusicPreviewCard({ music, compact = false }: { music: Music; compact?: boolean }) {
  const deezerUrl = music.deezerUrl ?? music.url;
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-muted/50 p-3.5">
      {music.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={music.coverUrl} alt="" className={compact ? "size-10 rounded-xl object-cover" : "size-14 rounded-2xl object-cover shadow-sm"} />
      ) : (
        <span className={compact ? "grid size-10 place-items-center rounded-xl bg-primary/10 text-primary" : "grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"}><Music2 /></span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{music.title}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{music.artist}</p>
        {!music.previewUrl && (
          <p className="mt-1 text-[10px] text-muted-foreground">Preview unavailable</p>
        )}
      </div>
      <AudioPreviewButton
        previewUrl={music.previewUrl}
        providerId={music.providerId ?? music.id}
        label={music.title}
      />
      {deezerUrl && (
        <Button asChild type="button" variant="ghost" size="icon-sm" className="shrink-0 rounded-full">
          <a href={deezerUrl} target="_blank" rel="noreferrer" aria-label={`Open ${music.title}`}>
            <ExternalLink />
          </a>
        </Button>
      )}
    </div>
  );
}
