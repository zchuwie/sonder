import { handleOptions } from "../_shared/cors.ts";
import { error, json } from "../_shared/responses.ts";

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

function normalizeTrack(track: DeezerTrack) {
  return {
    provider: "deezer" as const,
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

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  try {
    const url = new URL(req.url);
    const body =
      req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const query = (
      url.searchParams.get("q") ??
      body.query ??
      req.headers.get("x-query") ??
      ""
    )
      .trim()
      .slice(0, 100);
    const suggestions =
      url.searchParams.get("mode") === "suggestions" ||
      body.mode === "suggestions" ||
      query.length === 0;
    if (!suggestions && query.length < 2) return json({ results: [] });
    const base =
      Deno.env.get("DEEZER_API_BASE_URL") ?? "https://api.deezer.com";
    const response = await fetch(
      suggestions
        ? `${base}/chart/0/tracks?limit=12`
        : `${base}/search?q=${encodeURIComponent(query)}&limit=12`,
    );
    if (!response.ok) throw new Error("Music provider unavailable");
    const payload = await response.json();
    const results = ((payload.data ?? []) as DeezerTrack[]).map(normalizeTrack);
    return json({ results });
  } catch (cause) {
    return error(
      cause instanceof Error ? cause.message : "Unable to search music",
      502,
    );
  }
});
