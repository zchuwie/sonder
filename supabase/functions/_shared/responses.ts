import { corsHeaders } from "./cors.ts";
import { AppError } from "./app-error.ts";

export function json(
  data: unknown,
  status = 200,
  headers: HeadersInit = {},
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...headers },
  });
}

export function error(message: string, status = 400): Response {
  return json({ error: message }, status);
}

export function appError(cause: unknown, fallback: string): Response {
  if (cause instanceof AppError) {
    const rate = cause.details as
      | { limit?: number; remaining?: number; resetAt?: number }
      | undefined;
    const headers: Record<string, string> = {};
    if (rate?.limit != null) headers["X-RateLimit-Limit"] = String(rate.limit);
    if (rate?.remaining != null)
      headers["X-RateLimit-Remaining"] = String(rate.remaining);
    if (rate?.resetAt != null) {
      headers["X-RateLimit-Reset"] = String(rate.resetAt);
      headers["Retry-After"] = String(
        Math.max(1, rate.resetAt - Math.floor(Date.now() / 1000)),
      );
    }
    return json(
      { error: cause.code, message: cause.message, ...cause.details },
      cause.status,
      headers,
    );
  }
  console.error(fallback, cause);
  return json({ error: "request_failed", message: fallback }, 500);
}
