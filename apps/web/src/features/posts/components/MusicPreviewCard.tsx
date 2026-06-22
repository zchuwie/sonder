"use client";

import { Music2 } from "lucide-react";
import { AudioPreviewButton } from "@/features/music/components/AudioPreviewButton";
import type { Music } from "@/features/posts/lib/post-types";

export function MusicPreviewCard({ music }: { music: Music; compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border bg-muted/50 p-2.5">
      {music.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={music.coverUrl} alt="" className="size-10 rounded-lg object-cover" />
      ) : (
        <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><Music2 className="size-4" /></span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{music.title}</p>
        <p className="truncate text-[11px] text-muted-foreground">{music.artist}</p>
      </div>
      <AudioPreviewButton
        previewUrl={music.previewUrl}
        providerId={music.providerId ?? music.id}
        label={music.title}
      />
    </div>
  );
}
