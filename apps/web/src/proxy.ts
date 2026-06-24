import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// ponytail: in-memory cache with 30s TTL. Ceiling: single-instance only,
// multi-instance (serverless) each have their own cache. Upgrade: use Edge Config or KV.
let maintenanceCache: { value: boolean; expires: number } = { value: false, expires: 0 };

async function isMaintenanceMode(): Promise<boolean> {
  if (Date.now() < maintenanceCache.expires) return maintenanceCache.value;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;

  try {
    const res = await fetch(
      `${url}/rest/v1/site_settings?key=eq.maintenance_mode&select=value`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        cache: "no-store",
      },
    );
    if (!res.ok) return false;
    const rows = await res.json();
    const enabled = rows?.[0]?.value === true;
    maintenanceCache = { value: enabled, expires: Date.now() + 30_000 };
    return enabled;
  } catch {
    return maintenanceCache.value; // fallback to last known state
  }
}

const MAINTENANCE_PATH = "/maintenance";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Never block the maintenance page itself or static assets
  if (
    pathname === MAINTENANCE_PATH ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$/.test(pathname)
  ) {
    return updateSession(request);
  }

  if (await isMaintenanceMode()) {
    const maintenanceUrl = request.nextUrl.clone();
    maintenanceUrl.pathname = MAINTENANCE_PATH;
    return NextResponse.rewrite(maintenanceUrl);
  }

  const response = await updateSession(request);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
