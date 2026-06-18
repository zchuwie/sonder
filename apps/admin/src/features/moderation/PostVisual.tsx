"use client";

import { useEffect, useRef, useState } from "react";
import { CircleAlert, LoaderCircle, Music2, Pause, Play } from "lucide-react";
import { createPostImageUrl } from "./admin-queries";
import { getMusic, type PostRow } from "./types";

export function PostVisual({ post, compact = false }: { post: PostRow; compact?: boolean }) {
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    setImageUrl("");
    if (post.image_path) void createPostImageUrl(post.image_path).then(setImageUrl);
  }, [post.image_path]);

  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt="Attached post photo" className={`${compact ? "h-20" : "max-h-[360px]"} w-full rounded-2xl border border-[#dce3d8] bg-[#f0f4ed] object-contain`} />;
  }

  if (!compact) return null;
  return <div className="grid h-20 place-items-center rounded-2xl border border-[#dce3d8] bg-[#f0f4ed] text-xs font-medium text-slate-600">{post.music ? "Song" : "Text"}</div>;
}

function SongPreview({ previewUrl, providerId, title }: { previewUrl?: string; providerId?: string; title: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => () => audioRef.current?.pause(), []);

  async function toggle() {
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    setLoading(true);
    setFailed(false);
    let source = previewUrl;
    if (providerId && /^\d+$/.test(providerId)) {
      try {
        const response = await fetch(`/api/music/track/${providerId}`, { cache: "no-store" });
        if (response.ok) source = ((await response.json()) as { track?: { previewUrl?: string } }).track?.previewUrl ?? source;
      } catch {
        // Saved preview remains fallback.
      }
    }
    if (!source) {
      setLoading(false);
      setFailed(true);
      return;
    }
    const audio = new Audio(source);
    audioRef.current?.pause();
    audioRef.current = audio;
    audio.onended = () => setPlaying(false);
    audio.onerror = () => { setFailed(true); setPlaying(false); setLoading(false); };
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }

  return <button type="button" onClick={() => void toggle()} disabled={loading || (!previewUrl && !providerId)} className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary-hover disabled:bg-muted disabled:text-muted-foreground" aria-label={playing ? `Pause ${title}` : `Play ${title}`}>
    {failed ? <CircleAlert className="size-4" /> : loading ? <LoaderCircle className="size-4 animate-spin" /> : playing ? <Pause className="size-4" /> : <Play className="size-4 fill-current" />}
  </button>;
}

export function MusicCard({ post }: { post: PostRow }) {
  const music = getMusic(post.music);
  if (!music) return null;
  const playable = Boolean(music.previewUrl || music.providerId);

  return <section className="mt-4 rounded-2xl border border-[#dce3d8] bg-white p-4 shadow-sm">
    <div className="flex items-center gap-3">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#e7eee3] text-[#245236]"><Music2 className="size-5" /></span>
      <div className="min-w-0 flex-1"><p className="truncate font-semibold">{music.title ?? "Attached song"}</p><p className="truncate text-sm text-slate-600">{music.artist ?? "Unknown artist"}</p></div>
      <SongPreview previewUrl={music.previewUrl} providerId={music.providerId} title={music.title ?? "song preview"} />
    </div>
    {!playable && <p className="mt-3 text-xs text-amber-700">Preview unavailable for this song.</p>}
  </section>;
}
