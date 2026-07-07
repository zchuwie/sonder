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
      (imageUrl || row.image_path) && music
        ? "mixed"
        : (imageUrl || row.image_path)
          ? "photo"
          : music
            ? "song"
            : "text",
    imageUrl,
    imagePath: row.image_path ?? undefined,
    music: music ?? undefined,
    lat: row.lat,
    lng: row.lng,
    placeName: row.place_name ?? undefined,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
    moderationStatus: row.status,
  };
}

export function rowsToMarkers(rows: PostRow[]): MarkerData[] {
  const posts = rows.map((row) => rowToPost(row));

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
