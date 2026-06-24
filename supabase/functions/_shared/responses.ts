import { getCorsHeaders, corsHeaders } from "./cors.ts";
import { AppError } from "./app-error.ts";

// ponytail: pass `req` to get origin-restricted CORS. Without it, falls back to wildcard
// (only safe for responses where handleOptions already validated the preflight).
export function json(
  data: unknown,
  status = 200,
  headers: HeadersInit = {},
  req?: Request,
): Response {
  const cors = req ? getCorsHeaders(req) : corsHeaders;
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json", ...headers },
  });
}

export function error(message: string, status = 400, req?: Request): Response {
  return json({ error: message }, status, {}, req);
}

export function appError(cause: unknown, fallback: string, req?: Request): Response {
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
      req,
    );
  }
  console.error(fallback, cause);
  return json({ error: "request_failed", message: fallback }, 500, {}, req);
}
