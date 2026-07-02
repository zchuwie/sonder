"use client";

import { useEffect, useRef, useCallback, useState } from "react";

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA";

// ponytail: no client-side token cache. Every submission gets a fresh token.
// Turnstile tokens are single-use on the server. Caching caused P0-3 (anon rotation bypass).
// UX cost: widget renders every time (~300ms invisible solve for humans). Acceptable.

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

  const render = useCallback(() => {
    if (!containerRef.current || !window.turnstile) return;
    if (widgetId.current !== null) {
      window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    }
    widgetId.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      callback: (token: string) => { onToken(token); },
      "error-callback": () => onError?.(),
      "expired-callback": () => { onToken(""); },
      theme: "auto",
    });
  }, [onToken, onError]);

  useEffect(() => {
    const bypassSecret = process.env.NEXT_PUBLIC_BYPASS_SECRET;
    if (bypassSecret) {
      onToken(bypassSecret);
      return;
    }

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
  }, [render]);

  // Reset when resetKey changes (submission failure or re-render)
  useEffect(() => {
    if (resetKey !== undefined && resetKey > 0) {
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
