import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  rowsToMarkersWithSignedImages,
  type PostRow,
} from "@/features/posts/lib/post-mappers";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) return NextResponse.json([], { status: 503 });

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .in("status", ["approved", "flagged"])
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json([], { status: 500 });

  const markers = await rowsToMarkersWithSignedImages(
    (data ?? []) as PostRow[],
  );

  return NextResponse.json(markers, {
    headers: { "Cache-Control": "public, max-age=60" },
  });
}
