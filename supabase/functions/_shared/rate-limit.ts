import { AppError } from "./app-error.ts";

export type RateLimitInput = {
  key: string;
  limit: number;
  windowSeconds: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
};

const SCRIPT = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then redis.call("EXPIRE", KEYS[1], ARGV[2]) end
local ttl = redis.call("TTL", KEYS[1])
return {current, ttl}
`;

export async function rateLimit(
  input: RateLimitInput,
): Promise<RateLimitResult> {
  if (Deno.env.get("IS_DEVELOPMENT") === "true") {
    return {
      allowed: true,
      remaining: input.limit,
      resetAt: Math.floor(Date.now() / 1000) + input.windowSeconds,
      limit: input.limit,
    };
  }

  const url = Deno.env.get("UPSTASH_REDIS_REST_URL");
  const token = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");
  if (!url || !token) {
    throw new AppError(
      "rate_limit_unavailable",
      "Request protection is unavailable.",
      503,
    );
  }

  const response = await fetch(url, {
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
      `sonder:${input.key}`,
      String(input.limit),
      String(input.windowSeconds),
    ]),
  });
  if (!response.ok) {
    throw new AppError(
      "rate_limit_unavailable",
      "Request protection is unavailable.",
      503,
    );
  }
  const payload = (await response.json()) as { result?: [number, number] };
  const count = Number(payload.result?.[0] ?? input.limit + 1);
  const ttl = Math.max(1, Number(payload.result?.[1] ?? input.windowSeconds));
  return {
    allowed: count <= input.limit,
    remaining: Math.max(0, input.limit - count),
    resetAt: Math.floor(Date.now() / 1000) + ttl,
    limit: input.limit,
  };
}

export async function enforceRateLimits(inputs: RateLimitInput[]) {
  const results = await Promise.all(inputs.map(rateLimit));
  const blocked = results.find((result) => !result.allowed);
  if (blocked) {
    throw new AppError(
      "rate_limited",
      "Too many attempts. Please try again later.",
      429,
      blocked,
    );
  }
  return results;
}
