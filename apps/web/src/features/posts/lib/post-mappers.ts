import type { Database, Json } from "@/lib/supabase/database.types";
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
  signFn?: (imagePath: string) => Promise<string | undefined>,
): Promise<MarkerData[]> {
  const posts = await Promise.all(
    rows.map(async (row) => {
      if (!row.image_path) return rowToPost(row);
      try {
        const url = signFn
          ? await signFn(row.image_path)
          : undefined;
        return rowToPost(row, url);
      } catch {
        return rowToPost(row);
      }
    }),
  );
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
