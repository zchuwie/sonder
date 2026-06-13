import { notFound } from "next/navigation";
import { PublicPostView } from "@/features/posts/components/PublicPostView";
import { mockMarkers } from "@/features/posts/lib/mock-posts";
import { getVisiblePost } from "@/features/posts/server/post-queries";

export default async function PostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const post =
    (await getVisiblePost(postId)) ??
    mockMarkers
      .flatMap((marker) => marker.posts)
      .find(
        (item) =>
          item.id === postId && item.moderationStatus === "visible",
      );
  if (!post) notFound();
  return <PublicPostView post={post} />;
}
