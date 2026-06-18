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

  // Replace signed URLs with proxy paths so client doesn't see raw storage URLs
  for (const marker of markers) {
    for (const post of marker.posts) {
      if (post.imageUrl) post.imageUrl = `/api/post-image/${post.id}`;
    }
  }

  return NextResponse.json(markers, {
    headers: { "Cache-Control": "public, max-age=60" },
  });
}
