import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase)
    return NextResponse.json(
      { message: "Supabase unavailable." },
      { status: 503 },
    );

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user)
    return NextResponse.json(
      { message: "Authentication required." },
      { status: 401 },
    );

  const input = (await request.json().catch(() => null)) as {
    postId?: string;
    reason?: string;
    details?: string;
  } | null;
  const postId = input?.postId ?? "";
  const reason = (input?.reason ?? "").slice(0, 120);
  const details = input?.details?.trim().slice(0, 1000) || null;

  if (!uuidPattern.test(postId) || !reason)
    return NextResponse.json({ message: "Invalid report." }, { status: 400 });

  const { data: post } = await supabase
    .from("posts")
    .select("id")
    .eq("id", postId)
    .in("status", ["approved", "flagged"])
    .is("deleted_at", null)
    .maybeSingle();
  if (!post)
    return NextResponse.json({ message: "Post unavailable." }, { status: 404 });

  const { error } = await supabase.from("post_reports").insert({
    post_id: postId,
    reason,
    details,
    reported_by: user.id,
  });

  if (error?.code === "23505")
    return NextResponse.json(
      { message: "You have already reported this post." },
      { status: 409 },
    );
  if (error)
    return NextResponse.json(
      { message: "Unable to report post." },
      { status: 500 },
    );

  return NextResponse.json({ reported: true }, { status: 201 });
}
