/**
 * Cloudflare Turnstile server-side verification.
 *
 * ponytail: NO per-user cache. Every create-post call requires a fresh Turnstile token.
 * This prevents anonymous-user-rotation attacks (P0-3) since each submission needs a
 * real human to solve the challenge. Ceiling: extra ~80ms RTT per post — acceptable for
 * a moderated social app. Upgrade path: if latency matters, cache per IP instead of per user.
 */

import { AppError } from "./app-error.ts";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(
  token: string | undefined,
  _userId: string,
  ip?: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!token) {
    return { ok: false, error: "Turnstile token is required." };
  }

  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) {
    // ponytail: fail closed in production, open only in dev (P0-1 fix)
    if (Deno.env.get("IS_DEVELOPMENT") === "true") return { ok: true };
    throw new AppError(
      "turnstile_unavailable",
      "Bot verification is unavailable. Please try again later.",
      503,
    );
  }

  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);
  if (ip) formData.append("remoteip", ip);

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(5000),
    });
    const result = await res.json();
    if (result.success) {
      return { ok: true };
    }
    return { ok: false, error: "Bot verification failed. Please try again." };
  } catch {
    // ponytail: fail closed on network error (P0-2 fix)
    console.error("Turnstile siteverify request failed");
    return { ok: false, error: "Verification service unreachable. Please try again." };
  }
}
