// ponytail: CORS restricted to allowed origins via env var (P1-1 fix).
// Set ALLOWED_ORIGINS in Supabase Edge secrets as comma-separated list.
// e.g. "https://sonderconfessions.vercel.app,https://admin.sonderconfessions.vercel.app"

const allowedOrigins: Set<string> = new Set(
  (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
);

function getAllowOrigin(req: Request): string {
  // Dev fallback: if no origins configured, allow all (local dev only)
  if (allowedOrigins.size === 0) return "*";
  const origin = req.headers.get("origin") ?? "";
  return allowedOrigins.has(origin) ? origin : "";
}

export function getCorsHeaders(req: Request) {
  return {
    "Access-Control-Allow-Origin": getAllowOrigin(req),
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

/** @deprecated Use getCorsHeaders(req) instead for origin-restricted CORS */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export function handleOptions(req: Request): Response | null {
  return req.method === "OPTIONS"
    ? new Response("ok", { headers: getCorsHeaders(req) })
    : null;
}
