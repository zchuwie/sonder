"use client";

import { useEffect, useRef, useCallback, useState } from "react";

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA";

// ponytail: client-side token cache. Once user solves once, we reuse for 10 min.
// Ceiling: page refresh clears it. That's fine — server also caches per user.
const TOKEN_TTL_MS = 10 * 60 * 1000;
let cachedToken: { value: string; expires: number } | null = null;

function getCachedToken(): string | null {
  if (cachedToken && Date.now() < cachedToken.expires) return cachedToken.value;
  cachedToken = null;
  return null;
}

function setCachedToken(token: string) {
  cachedToken = { value: token, expires: Date.now() + TOKEN_TTL_MS };
}

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  if (typeof window !== "undefined" && window.turnstile) return Promise.resolve();
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_URL;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Turnstile script"));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

export function TurnstileWidget({
  onToken,
  onError,
  resetKey,
}: {
  onToken: (token: string) => void;
  onError?: () => void;
  /** Change this value to force a widget reset */
  resetKey?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [usedCache, setUsedCache] = useState(() => !!getCachedToken());

  // If we have a cached token, emit it on mount
  useEffect(() => {
    const cached = getCachedToken();
    if (cached) {
      setUsedCache(true);
      onToken(cached);
    }
  }, [onToken]);

  const render = useCallback(() => {
    if (!containerRef.current || !window.turnstile) return;
    if (widgetId.current !== null) {
      window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    }
    widgetId.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      callback: (token: string) => {
        setCachedToken(token);
        onToken(token);
      },
      "error-callback": () => onError?.(),
      "expired-callback": () => {
        cachedToken = null;
        onToken("");
      },
      theme: "auto",
    });
  }, [onToken, onError]);

  // Load script + render (only if no cached token)
  useEffect(() => {
    if (usedCache) return;
    let cancelled = false;
    loadScript()
      .then(() => { if (!cancelled) render(); })
      .catch(() => { if (!cancelled) setLoadError(true); });
    return () => {
      cancelled = true;
      if (widgetId.current !== null && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [render, usedCache]);

  // Reset when resetKey changes (submission failure)
  useEffect(() => {
    if (resetKey !== undefined && resetKey > 0) {
      // Invalidate cache on explicit reset
      cachedToken = null;
      setUsedCache(false);
      if (widgetId.current !== null && window.turnstile) {
        window.turnstile.reset(widgetId.current);
      }
    }
  }, [resetKey]);

  if (loadError) {
    return (
      <p className="rounded-xl bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400">
        Bot verification failed to load. Please refresh and try again.
      </p>
    );
  }

  // Don't show widget if cached token was used
  if (usedCache) return null;

  return <div ref={containerRef} className="my-2 flex justify-center [&>iframe]:rounded-xl" />;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
  }
}
