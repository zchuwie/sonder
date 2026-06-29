import type { Database, Json } from "@/lib/supabase/database.types";
import { fetchSignedPostImageUrls } from "@/lib/storage/image-url";
import type { AnonymousPost, MarkerData, Music } from "./post-types";
import { groupMarkersByLocation } from "./post-utils";

export type PostRow = Database["public"]["Tables"]["posts"]["Row"];

export function rowToPost(row: PostRow, imageUrl?: string): AnonymousPost {
  const music = row.music as (Json & Music) | null;
  return {
    id: row.id,
    title: row.title,
    text: row.body,
    type:
      imageUrl && music
        ? "mixed"
        : imageUrl
          ? "photo"
          : music
            ? "song"
            : "text",
    imageUrl,
    music: music ?? undefined,
    lat: row.lat,
    lng: row.lng,
    placeName: row.place_name ?? undefined,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
    moderationStatus: row.status,
  };
}

export async function rowsToMarkersWithSignedImages(
  rows: PostRow[],
): Promise<MarkerData[]> {
  // ponytail: batch-resolve all image URLs in one pass instead of N serial calls
  const postsWithImages = rows.filter((r) => r.image_path);
  const signedUrls = postsWithImages.length > 0
    ? await fetchSignedPostImageUrls(postsWithImages.map((r) => r.id))
    : new Map<string, string>();

  const posts = rows.map((row) => {
    const imageUrl = row.image_path ? signedUrls.get(row.id) : undefined;
    return rowToPost(row, imageUrl);
  });

  return groupMarkersByLocation(
    posts.map((post) => ({
      id: `${post.lat.toFixed(4)},${post.lng.toFixed(4)}`,
      lat: post.lat,
      lng: post.lng,
      placeName: post.placeName,
      posts: [post],
      source: "manual",
    })),
  );
}
