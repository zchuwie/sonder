"use client";

import { Clock3, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AnonymousPostCard } from "./AnonymousPostCard";
import type { AnonymousPost } from "@/features/posts/lib/post-types";
import { useMemo } from "react";

export function MyPendingPostsModal({
  open,
  posts,
  onOpenChange,
  onSelectPost,
}: {
  open: boolean;
  posts: AnonymousPost[];
  onOpenChange: (open: boolean) => void;
  onSelectPost: (post: AnonymousPost) => void;
}) {
  const pendingPosts = useMemo(
    () => posts.filter((post) => post.moderationStatus === "pending"),
    [posts],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-2xl">
        <DialogHeader className="border-b px-6 py-5 pr-14">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Clock3 className="size-5 text-primary" /> My thoughts
          </DialogTitle>
          <DialogDescription>
            These submissions are tied to this anonymous browser session.
          </DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[65vh] gap-4 overflow-y-auto p-5 sm:grid-cols-2">
          {pendingPosts.length ? (
            pendingPosts.map((post) => (
              <AnonymousPostCard
                key={post.id}
                post={post}
                onClick={() => onSelectPost(post)}
              />
            ))
          ) : (
            <div className="col-span-full grid place-items-center gap-3 py-16 text-center text-muted-foreground">
              <ShieldCheck className="size-8 text-primary" />
              <p className="text-sm font-medium text-foreground">
                No thoughts awaiting review.
              </p>
              <p className="max-w-sm text-xs leading-5">
                If browser data is cleared or another device is used,
                anonymous-session submissions may no longer be available here.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
