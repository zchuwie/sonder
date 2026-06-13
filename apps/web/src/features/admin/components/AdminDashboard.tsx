"use client";

import Link from "next/link";
import { Check, Clock3, Eye, MapPin, ShieldCheck, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useModeration } from "@/features/moderation/components/ModerationProvider";
import { relativeTime } from "@/features/posts/lib/post-utils";
import type { AnonymousPost } from "@/features/posts/lib/post-types";
import type { MarkerData } from "@/features/posts/lib/post-types";
import { useState } from "react";
import { moderateRemotePost } from "@/features/moderation/client/use-admin-posts";
import { AdminLogoutButton } from "./AdminLogoutButton";
import { MusicPreviewCard } from "@/features/posts/components/MusicPreviewCard";

function ModerationCard({
  post,
  placeName,
  onApprove,
  onReject,
}: {
  post: AnonymousPost;
  placeName?: string;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  return (
    <Card className="gap-0 overflow-hidden rounded-2xl p-0 sm:rounded-3xl">
      <div className="grid md:grid-cols-[180px_1fr]">
        <div className="aspect-[16/9] max-h-48 bg-gradient-to-br from-primary/20 via-muted to-background md:max-h-none md:aspect-auto">
          {post.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.imageUrl}
              alt=""
              className="size-full object-cover"
            />
          ) : post.music?.coverUrl ? (
            <div className="relative size-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.music.coverUrl} alt="" className="size-full scale-110 object-cover opacity-30 blur-xl" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.music.coverUrl} alt="" className="absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-2xl object-cover shadow-xl" />
            </div>
          ) : null}
        </div>
        <div className="space-y-3 p-4 sm:space-y-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Anonymous</Badge>
            <Badge variant="outline" className="capitalize">
              {post.moderationStatus}
            </Badge>
          </div>
          <div>
            <h3 className="text-lg font-semibold">{post.title}</h3>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
              {post.text}
            </p>
          </div>
          {post.music && <MusicPreviewCard music={post.music} compact />}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {placeName ?? "Pinned location"}
            </span>
            <span className="flex items-center gap-1">
              <Clock3 className="size-3.5" />
              {relativeTime(post.createdAt)}
            </span>
          </div>
          {(onApprove || onReject) && (
            <div className="grid grid-cols-2 gap-2 border-t pt-3 sm:flex sm:justify-end sm:pt-4">
              <Button
                variant="destructive"
                className="w-full rounded-xl sm:w-auto"
                onClick={onReject}
              >
                <Trash2 /> Reject
              </Button>
              <Button className="w-full rounded-xl sm:w-auto" onClick={onApprove}>
                <Check /> Approve
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export function AdminDashboard({
  initialMarkers,
}: {
  initialMarkers?: MarkerData[] | null;
}) {
  const fallback = useModeration();
  const [remoteMarkers, setRemoteMarkers] = useState(initialMarkers ?? null);
  const markers = remoteMarkers ?? fallback.markers;
  const pending = markers.flatMap((marker) =>
    marker.posts
      .filter((post) => post.moderationStatus === "pending")
      .map((post) => ({ marker, post })),
  );
  const decide = (postId: string, decision: "approve" | "reject") => {
    if (!remoteMarkers) return fallback.decide(postId, decision);
    void moderateRemotePost(postId, decision).then(() => {
      setRemoteMarkers(
        (current) =>
          current?.map((marker) => ({
            ...marker,
            posts: marker.posts.map((post) =>
              post.id === postId
                ? {
                    ...post,
                    moderationStatus:
                      decision === "approve" ? "visible" : "rejected",
                  }
                : post,
            ),
          })) ?? null,
      );
    });
  };
  const allPosts = markers.flatMap((marker) =>
    marker.posts.map((post) => ({ marker, post })),
  );
  const visible = allPosts.filter(
    ({ post }) => post.moderationStatus === "visible",
  );
  const rejected = allPosts.filter(
    ({ post }) =>
      post.moderationStatus === "rejected" ||
      post.moderationStatus === "hidden",
  );

  return (
    <div className="min-h-dvh bg-muted/40">
      <header className="border-b bg-background/95 px-3 py-3 backdrop-blur sm:px-5 sm:py-4">
        <div className="mx-auto flex max-w-6xl flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-lg font-semibold text-primary">
              <ShieldCheck className="size-5" /> Sonder Admin
            </p>
            <p className="text-xs text-muted-foreground">
              Moderate anonymous public thoughts
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/map">
                <Eye /> View public map
              </Link>
            </Button>
            <AdminLogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-4 px-3 py-5 sm:space-y-6 sm:px-5 sm:py-8">
        <section className="grid grid-cols-3 gap-2 sm:gap-4">
          {[
            { label: "Pending review", value: pending.length },
            { label: "Visible posts", value: visible.length },
            { label: "Rejected posts", value: rejected.length },
          ].map((item) => (
            <Card key={item.label} className="rounded-2xl p-3 sm:rounded-3xl sm:p-5">
              <p className="text-[10px] leading-4 text-muted-foreground sm:text-sm">{item.label}</p>
              <p className="mt-1 text-2xl font-semibold text-primary sm:mt-2 sm:text-3xl">
                {item.value}
              </p>
            </Card>
          ))}
        </section>
        <Tabs defaultValue="pending">
          <TabsList className="w-full rounded-xl">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="visible">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
          <TabsContent value="pending" className="mt-4 space-y-3 sm:mt-5 sm:space-y-4">
            {pending.length ? (
              pending.map(({ marker, post }) => (
                <ModerationCard
                  key={post.id}
                  post={post}
                  placeName={marker.placeName}
                  onApprove={() => decide(post.id, "approve")}
                  onReject={() => decide(post.id, "reject")}
                />
              ))
            ) : (
              <EmptyState text="No posts are waiting for review." />
            )}
          </TabsContent>
          <TabsContent value="visible" className="mt-4 space-y-3 sm:mt-5 sm:space-y-4">
            {visible.length ? (
              visible.map(({ marker, post }) => (
                <ModerationCard
                  key={post.id}
                  post={post}
                  placeName={marker.placeName}
                />
              ))
            ) : (
              <EmptyState text="No approved posts yet." />
            )}
          </TabsContent>
          <TabsContent value="rejected" className="mt-4 space-y-3 sm:mt-5 sm:space-y-4">
            {rejected.length ? (
              rejected.map(({ marker, post }) => (
                <ModerationCard
                  key={post.id}
                  post={post}
                  placeName={marker.placeName}
                />
              ))
            ) : (
              <EmptyState text="No rejected posts." />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-dashed bg-background/70 px-6 py-16 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
