import { NextResponse } from "next/server";

// Uses the same Upstash Redis EVAL script as the Supabase edge functions.
// Bypassed entirely when NEXT_PUBLIC_BYPASS_SECRET is present (local dev).
// Fails open (returns null) if Redis is not configured, so missing env vars
// never break the app — only leave it unprotected.

const SCRIPT = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then redis.call("EXPIRE", KEYS[1], ARGV[2]) end
local ttl = redis.call("TTL", KEYS[1])
return {current, ttl}
`;

async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Returns a 429 NextResponse if the IP exceeds the limit, otherwise null.
 * Call at the top of a route handler; return early if non-null.
 */
export async function checkRateLimit(
  request: Request,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<NextResponse | null> {
  // Bypass in local dev (NEXT_PUBLIC_BYPASS_SECRET set in .env.local)
  if (process.env.NEXT_PUBLIC_BYPASS_SECRET) return null;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null; // fail open if Redis not configured

  const rawIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const ipHash = await hashIp(rawIp);
  const redisKey = `sonder:${key}:${ipHash}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      signal: AbortSignal.timeout(3000),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        "EVAL",
        SCRIPT,
        "1",
        redisKey,
        String(limit),
        String(windowSeconds),
      ]),
    });
    if (!res.ok) return null; // fail open on Redis error

    const payload = (await res.json()) as { result?: [number, number] };
    const count = Number(payload.result?.[0] ?? limit + 1);
    if (count > limit) {
      const ttl = Math.max(1, Number(payload.result?.[1] ?? windowSeconds));
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": String(ttl),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
        },
      });
    }
    return null;
  } catch {
    return null; // fail open on network error
  }
}
