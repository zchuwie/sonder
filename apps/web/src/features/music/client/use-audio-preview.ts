"use client";

import { useCallback, useEffect, useRef, useState } from "react";

let activeAudio: HTMLAudioElement | null = null;
let activeUrl: string | undefined;
let loadingUrl: string | undefined;
let errorUrl: string | undefined;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function stopActive() {
  activeAudio?.pause();
  activeAudio = null;
  activeUrl = undefined;
  loadingUrl = undefined;
  notify();
}

export function useAudioPreview() {
  const [, refresh] = useState(0);
  const ownedUrl = useRef<string | undefined>(undefined);

  useEffect(() => {
    const listener = () => refresh((value) => value + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      if (ownedUrl.current && ownedUrl.current === activeUrl) stopActive();
    };
  }, []);

  const toggle = useCallback(async (url?: string) => {
    if (!url) return;
    ownedUrl.current = url;
    if (activeUrl === url) {
      stopActive();
      return;
    }

    stopActive();
    errorUrl = undefined;
    loadingUrl = url;
    notify();
    const audio = new Audio(url);
    audio.onended = stopActive;
    audio.onerror = () => {
      errorUrl = url;
      stopActive();
    };
    activeAudio = audio;
    activeUrl = url;
    try {
      await audio.play();
      loadingUrl = undefined;
      notify();
    } catch {
      errorUrl = url;
      stopActive();
    }
  }, []);

  return {
    playingUrl: activeUrl,
    loadingUrl,
    errorUrl,
    toggle,
    stop: stopActive,
  };
}
