"use client";

import { useState } from "react";
import {
  LoaderCircle,
  Music2,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Music } from "@/features/posts/lib/post-types";
import { useDeezerSearch } from "@/features/music/client/use-deezer-search";
import { AudioPreviewButton } from "@/features/music/components/AudioPreviewButton";

export type SongSearchResult = Music & { id: string };

export function SongSearchPicker({
  value,
  onChange,
}: {
  value?: Music;
  onChange: (music?: Music) => void;
}) {
  const [query, setQuery] = useState("");
  const { results: deezerResults, loading, error } = useDeezerSearch(query);
  const results: SongSearchResult[] = deezerResults.map((song) => ({
        id: song.providerId,
        provider: "deezer",
        providerId: song.providerId,
        title: song.title,
        artist: song.artist,
        album: song.album,
        platform: "deezer",
        url: song.deezerUrl,
        deezerUrl: song.deezerUrl,
        previewUrl: song.previewUrl,
        coverUrl: song.coverUrl,
        duration: song.duration ? String(song.duration) : undefined,
      }));

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border bg-muted/45 p-3">
        {value.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value.coverUrl} alt="" className="size-11 rounded-xl object-cover" />
        ) : (
          <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
            <Music2 className="size-5" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{value.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {value.artist}
            {value.album ? ` · ${value.album}` : ""}
          </p>
        </div>
        {value.previewUrl && (
          <AudioPreviewButton
            previewUrl={value.previewUrl}
            providerId={value.providerId ?? value.id}
            label={value.title}
          />
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="rounded-full"
          onClick={() => onChange(undefined)}
          aria-label="Remove song"
        >
          <X />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border bg-muted/25">
      <div className="relative p-3">
        {loading ? (
          <LoaderCircle className="absolute left-6 top-1/2 size-4 -translate-y-1/2 animate-spin text-primary" />
        ) : (
          <Search className="absolute left-6 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        )}
        <Input
          id="song-search"
          aria-label="Search songs"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search songs..."
          className="rounded-xl bg-background pl-9"
        />
      </div>
      <div className="border-t">
        <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {query.trim() ? "Search results" : "Suggested songs"}
        </p>
        <div className="max-h-[280px] space-y-1 overflow-y-auto p-2 pt-1">
          {loading ? (
            <div className="grid place-items-center gap-2 py-8 text-xs text-muted-foreground">
              <LoaderCircle className="size-5 animate-spin text-primary" />
              {query.trim() ? "Searching songs..." : "Loading suggestions..."}
            </div>
          ) : error && !results.length ? (
            <div className="grid place-items-center gap-2 py-8 text-center text-xs text-muted-foreground">
              <Music2 className="size-5" />
              Unable to load songs right now.
            </div>
          ) : results.length ? (
            results.map((song) => (
              <div
                key={song.id}
                className="flex h-14 w-full items-center gap-2 rounded-xl px-2 text-left transition-colors hover:bg-muted focus-within:bg-muted sm:gap-3"
              >
                <button
                  type="button"
                  onClick={() => {
                    onChange(song);
                  }}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {song.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={song.coverUrl} alt="" className="size-10 rounded-lg object-cover" />
                  ) : (
                    <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                      <Music2 className="size-4" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold">
                    {song.title}
                  </span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {song.artist}
                    {song.album ? ` · ${song.album}` : ""}
                  </span>
                  </span>
                </button>
                {song.previewUrl && (
                  <AudioPreviewButton
                    previewUrl={song.previewUrl}
                    providerId={song.providerId ?? song.id}
                    label={song.title}
                  />
                )}
                {!song.previewUrl && (
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    Preview unavailable
                  </span>
                )}
              </div>
            ))
          ) : (
            <div className="grid place-items-center gap-2 py-7 text-xs text-muted-foreground">
              <Music2 className="size-5" />
              No songs found. Try a different keyword.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
