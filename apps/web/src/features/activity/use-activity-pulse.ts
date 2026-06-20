"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { ensureAnonymousSession } from "@/lib/auth/anonymous-session";

// ponytail: fun messages rotated randomly when a new post appears.
const NEW_POST_MESSAGES = [
  "Someone just dropped a thought 💭",
  "A new pin appeared on the map 📍",
  "Fresh thought just landed ✨",
  "Someone left a moment behind 🌿",
  "A stranger shared something nearby 👀",
  "New thought spotted in the wild 🦋",
  "The map just got a little fuller 🗺️",
];

const MULTI_POST_MESSAGES = [
  "thoughts were pinned while you were away",
  "new moments appeared on the map",
  "fresh thoughts just dropped",
];

function pickRandom(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/**
 * Polls /api/activity every 60s.
 * - Sends a heartbeat (POST) so the server knows we're active.
 * - Checks if new posts appeared and shows a fun toast.
 * - Calls onNewPosts when fresh content is detected.
 * - Pauses when tab is hidden.
 */
export function useActivityPulse(onNewPosts?: () => void) {
  const lastCount = useRef<number | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    async function pulse() {
      if (document.hidden) return;

      // Send heartbeat
      try {
        await ensureAnonymousSession();
        await fetch("/api/activity", { method: "POST" });
      } catch {
        // Silent — heartbeat is best-effort
      }

      // Check for new posts
      try {
        const res = await fetch("/api/activity");
        if (!res.ok) return;
        const { postCount } = (await res.json()) as { postCount: number };

        if (lastCount.current !== null && postCount > lastCount.current) {
          const diff = postCount - lastCount.current;
          if (diff === 1) {
            toast(pickRandom(NEW_POST_MESSAGES), { duration: 4000 });
          } else {
            toast(`${diff} ${pickRandom(MULTI_POST_MESSAGES)}`, { duration: 4000 });
          }
          onNewPosts?.();
        }
        lastCount.current = postCount;
      } catch {
        // Silent — activity check is non-critical
      }
    }

    // Initial pulse after short delay (don't block page load)
    const initial = setTimeout(pulse, 3000);
    timer = setInterval(pulse, 60_000);

    // Pause/resume on visibility change
    const onVisibility = () => {
      if (!document.hidden) void pulse();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearTimeout(initial);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
}
