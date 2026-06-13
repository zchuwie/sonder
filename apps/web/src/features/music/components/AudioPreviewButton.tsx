"use client";

import { useState } from "react";
import { CircleAlert, LoaderCircle, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudioPreview } from "@/features/music/client/use-audio-preview";
import type { MusicSearchResult } from "@/features/music/lib/music-types";

export function AudioPreviewButton({
  previewUrl,
  providerId,
  label = "song",
}: {
  previewUrl?: string;
  providerId?: string;
  label?: string;
}) {
  const { playingUrl, loadingUrl, errorUrl, toggle } = useAudioPreview();
  const [resolving, setResolving] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState(previewUrl);
  const playableUrl = resolvedUrl ?? previewUrl;
  const playing = playingUrl === playableUrl;
  const loading = loadingUrl === playableUrl || resolving;
  const failed = errorUrl === playableUrl;

  const play = async () => {
    if (playing) {
      await toggle(playableUrl);
      return;
    }
    let currentUrl = playableUrl;
    if (providerId && /^\d+$/.test(providerId)) {
      setResolving(true);
      try {
        const response = await fetch(`/api/music/track/${providerId}`, {
          cache: "no-store",
        });
        if (response.ok) {
          const payload = (await response.json()) as {
            track?: MusicSearchResult;
          };
          currentUrl = payload.track?.previewUrl ?? currentUrl;
          setResolvedUrl(currentUrl);
        }
      } finally {
        setResolving(false);
      }
    }
    await toggle(currentUrl);
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="shrink-0 rounded-full"
      disabled={(!playableUrl && !providerId) || loading}
      onClick={() => void play()}
      aria-label={
        !playableUrl && !providerId
          ? `Preview unavailable for ${label}`
          : playing
            ? `Pause ${label} preview`
            : `Play ${label} preview`
      }
      title={failed ? "Preview could not be loaded" : undefined}
    >
      {failed ? (
        <CircleAlert />
      ) : loading ? (
        <LoaderCircle className="animate-spin" />
      ) : playing ? (
        <Pause />
      ) : (
        <Play />
      )}
    </Button>
  );
}
