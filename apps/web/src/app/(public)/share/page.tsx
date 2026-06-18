"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { PublicPostView } from "@/features/posts/components/PublicPostView";
import { Button } from "@/components/ui/button";
import type { AnonymousPost } from "@/features/posts/lib/post-types";

function SharedPost() {
  const raw = useSearchParams().get("d");
  let post: AnonymousPost | null = null;
  try {
    if (raw) {
      const legacyBase64 = raw.replace(/ /g, "+").replace(/-/g, "+").replace(/_/g, "/");
      post = JSON.parse(
        decodeURIComponent(escape(atob(legacyBase64))),
      ) as AnonymousPost;
    }
  } catch {
    post = null;
  }
  if (post?.moderationStatus === "approved") return <PublicPostView post={post} />;
  return <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-muted/50 p-6 text-center"><AlertTriangle className="size-8 text-primary" /><h1 className="text-xl font-semibold">This share link could not be opened.</h1><p className="text-sm text-muted-foreground">It may be incomplete or no longer available.</p><Button asChild className="rounded-xl"><Link href="/">Open Sonder</Link></Button></main>;
}

export default function SharePage() {
  return <Suspense fallback={<div className="min-h-dvh bg-muted/50" />}><SharedPost /></Suspense>;
}
