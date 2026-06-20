import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ponytail: single cached query per request. Multiple clients hitting this
// within the same second get the same result via HTTP cache headers.

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ postCount: 0, activeUsers: 0 }, { status: 503 });

  const [{ count }, { count: activeCount }] = await Promise.all([
    supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .in("status", ["approved", "flagged"])
      .is("deleted_at", null),
    supabase
      .from("heartbeats")
      .select("*", { count: "exact", head: true })
      .gte("last_seen", new Date(Date.now() - 2 * 60_000).toISOString()),
  ]);

  return NextResponse.json(
    { postCount: count ?? 0, activeUsers: activeCount ?? 0 },
    { headers: { "Cache-Control": "public, max-age=15" } },
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ ok: false }, { status: 503 });

  // Best-effort heartbeat — don't fail if user has no session
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) return NextResponse.json({ ok: true });

  await supabase
    .from("heartbeats")
    .upsert({ user_id: userId, last_seen: new Date().toISOString() }, { onConflict: "user_id" });

  return NextResponse.json({ ok: true });
}
