import { ExternalLink, Music2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Music } from "@/features/posts/lib/post-types";

export function MusicPreviewCard({ music, compact = false }: { music: Music; compact?: boolean }) {
  const content = (
    <div className="flex items-center gap-3">
      {music.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={music.coverUrl} alt="" className={compact ? "size-10 rounded-xl object-cover" : "size-14 rounded-2xl object-cover shadow-sm"} />
      ) : (
        <span className={compact ? "grid size-10 place-items-center rounded-xl bg-primary/10 text-primary" : "grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"}><Music2 /></span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{music.title}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{music.artist}</p>
      </div>
      {music.platform && <Badge variant="secondary" className="rounded-full capitalize">{music.platform}</Badge>}
      {music.url && <ExternalLink className="size-3.5 text-muted-foreground" />}
    </div>
  );
  return music.url ? <a href={music.url} target="_blank" rel="noreferrer" className="block rounded-2xl border bg-muted/50 p-3.5 transition hover:bg-muted">{content}</a> : <div className="rounded-2xl border bg-muted/50 p-3.5">{content}</div>;
}
