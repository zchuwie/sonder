import type { AnonymousPost, MarkerData } from "@/features/posts/lib/post-types";

export type ModerationDecision = "approve" | "reject";

export type ModerationQueueItem = {
  marker: MarkerData;
  post: AnonymousPost;
};
