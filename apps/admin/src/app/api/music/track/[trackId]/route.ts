import { NextRequest, NextResponse } from "next/server";

type DeezerTrack = {
  id?: string | number;
  title?: string;
  preview?: string;
  artist?: { name?: string };
};

function secureUrl(value?: string) {
  return value?.replace(/^http:\/\//, "https://") || undefined;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ trackId: string }> },
) {
  const { trackId } = await params;
  if (!/^\d+$/.test(trackId)) {
    return NextResponse.json({ error: "Invalid track ID" }, { status: 400 });
  }

  try {
    const base = process.env.DEEZER_API_BASE_URL ?? "https://api.deezer.com";
    const response = await fetch(`${base}/track/${trackId}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!response.ok) throw new Error("Music provider unavailable");
    const track = (await response.json()) as DeezerTrack;
    return NextResponse.json({
      track: {
        providerId: String(track.id ?? ""),
        title: track.title ?? "Unknown track",
        artist: track.artist?.name ?? "Unknown artist",
        previewUrl: secureUrl(track.preview),
      },
    });
  } catch {
    return NextResponse.json({ error: "Unable to refresh song preview." }, { status: 502 });
  }
}
