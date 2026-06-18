import { NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return new NextResponse(null, { status: 503 });

  const supabase = createServiceClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const { data: post } = await supabase
    .from("posts")
    .select("image_path")
    .eq("id", postId)
    .in("status", ["approved", "flagged"])
    .is("deleted_at", null)
    .maybeSingle();

  if (!post?.image_path) return new NextResponse(null, { status: 404 });

  const { data: signed } = await supabase.storage
    .from("post-images")
    .createSignedUrl(post.image_path, 60);
  if (!signed?.signedUrl) return new NextResponse(null, { status: 404 });

  const image = await fetch(signed.signedUrl);
  if (!image.ok) return new NextResponse(null, { status: image.status });

  return new NextResponse(image.body, {
    headers: {
      "Cache-Control": "public, max-age=300",
      "Content-Type": image.headers.get("content-type") ?? "image/jpeg",
    },
  });
}
