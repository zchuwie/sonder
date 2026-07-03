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

export async function GET(request: NextRequest) {
  const limited = await checkRateLimit(request, "music-search", 30, 60);
  if (limited) return limited;

  const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, 100) ?? "";
  const suggestions =
    request.nextUrl.searchParams.get("mode") === "suggestions" || !query;

  if (!suggestions && query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const base = process.env.DEEZER_API_BASE_URL ?? "https://api.deezer.com";
    const endpoint = suggestions
      ? `${base}/chart/0/tracks?limit=12`
      : `${base}/search?q=${encodeURIComponent(query)}&limit=12`;
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      next: { revalidate: suggestions ? 900 : 300 },
    });
    if (!response.ok) throw new Error(`Deezer returned ${response.status}`);
    const payload = (await response.json()) as { data?: DeezerTrack[] };
    return NextResponse.json({
      results: (payload.data ?? []).map(normalizeTrack),
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to load songs right now.", results: [] },
      { status: 502 },
    );
  }
}
