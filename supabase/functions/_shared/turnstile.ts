/**
 * Cloudflare Turnstile server-side verification.
 * Verified users are cached for 10 minutes so they don't need to re-verify on every post.
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// ponytail: in-memory cache per edge function instance. Ceiling: per-isolate only,
// doesn't share across cold starts. Good enough — worst case user solves again after cold start.
const verified = new Map<string, number>();

export async function verifyTurnstile(
  token: string | undefined,
  userId: string,
  ip?: string,
): Promise<{ ok: boolean; error?: string }> {
  // Check cache first — if user verified recently, skip
  const cachedUntil = verified.get(userId);
  if (cachedUntil && Date.now() < cachedUntil) {
    return { ok: true };
  }

  if (!token) {
    return { ok: false, error: "Turnstile token is required." };
  }

  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) {
    // If secret isn't configured, let it through (dev/migration safety)
    console.warn("TURNSTILE_SECRET_KEY not set — skipping verification");
    return { ok: true };
  }

  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);
  if (ip) formData.append("remoteip", ip);

  try {
    const res = await fetch(VERIFY_URL, { method: "POST", body: formData });
    const result = await res.json();
    if (result.success) {
      // Cache this user for 10 minutes
      verified.set(userId, Date.now() + CACHE_TTL_MS);
      // Lazy cleanup: evict expired entries when map grows
      if (verified.size > 1000) {
        const now = Date.now();
        for (const [k, v] of verified) {
          if (v < now) verified.delete(k);
        }
      }
      return { ok: true };
    }
    return { ok: false, error: "Bot verification failed. Please try again." };
  } catch {
    // Network failure to Cloudflare — fail open to not block legitimate users
    console.error("Turnstile siteverify request failed");
    return { ok: true };
  }
}
