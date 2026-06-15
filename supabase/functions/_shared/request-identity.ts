import { AppError } from "./app-error.ts";

function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (
    req.headers.get("cf-connecting-ip")?.trim() ||
    forwarded ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function getIpHash(req: Request): Promise<string> {
  const salt = Deno.env.get("RATE_LIMIT_SALT");
  const development = Deno.env.get("IS_DEVELOPMENT") === "true";
  if (!salt) {
    if (development) return "development";
    throw new AppError(
      "rate_limit_unavailable",
      "Request protection is unavailable.",
      503,
    );
  }
  const bytes = new TextEncoder().encode(`${salt}:${getClientIp(req)}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}
