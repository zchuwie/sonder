import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  rowsToMarkersWithSignedImages,
  type PostRow,
} from "@/features/posts/lib/post-mappers";

export async function GET(request: NextRequest) {
  const limited = await checkRateLimit(request, "posts", 30, 60);
  if (limited) return limited;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json([], { status: 503 });

  const { searchParams } = request.nextUrl;
  const minLat = Number(searchParams.get("south") ?? -90);
  const minLng = Number(searchParams.get("west") ?? -180);
  const maxLat = Number(searchParams.get("north") ?? 90);
  const maxLng = Number(searchParams.get("east") ?? 180);

  const { data, error } = await supabase.rpc("get_posts_in_bounds", {
    min_lat: minLat,
    min_lng: minLng,
    max_lat: maxLat,
    max_lng: maxLng,
    lim: 200,
  });

  if (error) return NextResponse.json([], { status: 500 });

  const markers = await rowsToMarkersWithSignedImages(
    (data ?? []) as PostRow[],
  );

  return NextResponse.json(markers, {
    headers: { "Cache-Control": "public, max-age=60" },
  });
}
