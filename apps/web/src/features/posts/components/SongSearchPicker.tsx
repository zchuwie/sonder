"use client";

import { useMemo, useState } from "react";
import { LoaderCircle, Music2, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MusicPreviewCard } from "./MusicPreviewCard";
import type { Music } from "@/features/posts/lib/post-types";

export type SongSearchResult = Music & { id: string };

const MOCK_SONGS: SongSearchResult[] = [
  { id: "leaves", title: "Leaves", artist: "Ben&Ben", album: "Leaves", platform: "spotify", url: "https://open.spotify.com/", coverUrl: "https://picsum.photos/seed/sonder-leaves/120/120", duration: "5:31" },
  { id: "tahanan", title: "Tahanan", artist: "Adie", album: "Tahanan", platform: "spotify", url: "https://open.spotify.com/", coverUrl: "https://picsum.photos/seed/sonder-tahanan/120/120", duration: "4:53" },
  { id: "unti", title: "Unti-Unti", artist: "Up Dharma Down", album: "UDD", platform: "spotify", url: "https://open.spotify.com/", coverUrl: "https://picsum.photos/seed/sonder-unti/120/120", duration: "5:02" },
];

export async function searchSongs(query: string): Promise<SongSearchResult[]> {
  return MOCK_SONGS.filter((song) => `${song.title} ${song.artist} ${song.album}`.toLowerCase().includes(query.toLowerCase()));
}

export function SongSearchPicker({ value, onChange }: { value?: Music; onChange: (music?: Music) => void }) {
  const [query, setQuery] = useState("");
  const [loading] = useState(false);
  const results = useMemo(() => query.trim() ? MOCK_SONGS.filter((song) => `${song.title} ${song.artist}`.toLowerCase().includes(query.toLowerCase())) : [], [query]);

  if (value) return <div className="relative"><MusicPreviewCard music={value} /><Button type="button" variant="secondary" size="icon-sm" className="absolute right-2 top-2 rounded-full" onClick={() => onChange(undefined)} aria-label="Remove song"><X /></Button></div>;

  return (
    <div className="w-full overflow-hidden rounded-2xl border bg-muted/25">
      <div className="relative p-3">
        {loading ? <LoaderCircle className="absolute left-6 top-1/2 size-4 -translate-y-1/2 animate-spin text-primary" /> : <Search className="absolute left-6 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />}
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search songs..." className="rounded-xl bg-background pl-9" />
      </div>
      {query.trim() && <div className="max-h-28 space-y-1 overflow-y-auto border-t p-2">
        {results.length ? results.map((song) => <button type="button" key={song.id} onClick={() => onChange(song)} className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={song.coverUrl} alt="" className="size-9 rounded-lg object-cover" />
          <span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{song.title}</span><span className="block truncate text-[11px] text-muted-foreground">{song.artist}</span></span>
          <Badge variant="secondary" className="rounded-full text-[10px]">Spotify</Badge>
        </button>) : <div className="grid place-items-center gap-2 py-7 text-xs text-muted-foreground"><Music2 className="size-5" />No songs found</div>}
      </div>}
    </div>
  );
}
