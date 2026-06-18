"use client";

import { Clock3, Check, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AnonymousPostCard } from "./AnonymousPostCard";
import type { AnonymousPost } from "@/features/posts/lib/post-types";
import { useMemo, useState } from "react";

type Tab = "pending" | "approved";

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
  const [tab, setTab] = useState<Tab>("pending");

  const pending = useMemo(
    () => posts.filter((p) => p.moderationStatus === "pending"),
    [posts],
  );
  const approved = useMemo(
    () => posts.filter((p) => p.moderationStatus === "approved" || p.moderationStatus === "flagged"),
    [posts],
  );

  const visible = tab === "pending" ? pending : approved;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-none gap-0 overflow-hidden rounded-2xl p-0 sm:max-h-[88dvh] sm:w-full sm:max-w-2xl sm:rounded-3xl">
        <DialogHeader className="border-b px-4 py-4 pr-12 sm:px-6 sm:py-5 sm:pr-14">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Clock3 className="size-5 text-primary" /> My thoughts
          </DialogTitle>
          <DialogDescription>
            Submissions tied to this anonymous browser session.
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setTab("pending")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition ${
              tab === "pending"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock3 className="size-3.5" />
            Pending
            {pending.length > 0 && (
              <span className="rounded-full bg-amber-100 px-1.5 text-[10px] font-semibold text-amber-800">{pending.length}</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setTab("approved")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition ${
              tab === "approved"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Check className="size-3.5" />
            Approved
            {approved.length > 0 && (
              <span className="rounded-full bg-green-100 px-1.5 text-[10px] font-semibold text-green-800">{approved.length}</span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(100dvh-12rem)] overflow-y-auto p-3 sm:max-h-[60vh] sm:p-5">
          {visible.length ? (
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              {visible.map((post) => (
                <AnonymousPostCard
                  key={post.id}
                  post={post}
                  onClick={() => onSelectPost(post)}
                />
              ))}
            </div>
          ) : (
            <div className="grid place-items-center gap-3 py-12 text-center text-muted-foreground">
              <ShieldCheck className="size-8 text-primary" />
              <p className="text-sm font-medium text-foreground">
                {tab === "pending" ? "No thoughts awaiting review." : "No approved thoughts yet."}
              </p>
              <p className="max-w-sm text-xs leading-5">
                {tab === "pending"
                  ? "Submitted thoughts will appear here until moderation review."
                  : "Once a thought is approved, it becomes visible on the public map."}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
