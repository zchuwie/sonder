import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import type { MusicSearchResult } from "@/features/music/lib/music-types";

type DeezerTrack = {
  id?: string | number;
  title?: string;
  link?: string;
  preview?: string;
  duration?: number;
  artist?: { name?: string };
  album?: { title?: string; cover_medium?: string; cover_xl?: string };
};

function secureUrl(value?: string) {
  return value?.replace(/^http:\/\//, "https://") || undefined;
}

function normalizeTrack(track: DeezerTrack): MusicSearchResult {
  return {
    provider: "deezer",
    providerId: String(track.id ?? ""),
    title: track.title ?? "Unknown track",
    artist: track.artist?.name ?? "Unknown artist",
    album: track.album?.title || undefined,
    coverUrl: secureUrl(track.album?.cover_xl || track.album?.cover_medium),
    previewUrl: secureUrl(track.preview),
    deezerUrl: secureUrl(track.link),
    duration: track.duration,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> },
) {
  const { trackId } = await params;
  if (!/^\d+$/.test(trackId)) {
    return NextResponse.json({ error: "Invalid Deezer track ID" }, { status: 400 });
  }

  const limited = await checkRateLimit(_request, "music-track", 60, 3600);
  if (limited) return limited;

  try {
    const base = process.env.DEEZER_API_BASE_URL ?? "https://api.deezer.com";
    const response = await fetch(`${base}/track/${trackId}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (!response.ok) throw new Error(`Deezer returned ${response.status}`);
    return NextResponse.json({ track: normalizeTrack(await response.json()) });
  } catch {
    return NextResponse.json(
      { error: "Unable to refresh this song preview." },
      { status: 502 },
    );
  }
}
