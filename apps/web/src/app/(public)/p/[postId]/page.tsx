import { notFound } from "next/navigation";
import { PublicPostView } from "@/features/posts/components/PublicPostView";
import { getVisiblePost } from "@/features/posts/server/post-queries";

export default async function PostPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const post = await getVisiblePost(postId);
  if (!post) notFound();
  return <PublicPostView post={post} />;
}
