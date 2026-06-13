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
    moderationStatus: row.status,
  };
}

export function rowsToMarkers(rows: PostRow[]): MarkerData[] {
  return groupMarkersByLocation(
    rows.map((row) => ({
      id: row.group_key,
      lat: row.lat,
      lng: row.lng,
      placeName: row.place_name ?? undefined,
      posts: [rowToPost(row)],
      source: "manual",
    })),
  );
}

export async function rowsToMarkersWithSignedImages(
  rows: PostRow[],
): Promise<MarkerData[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const posts = await Promise.all(
    rows.map(async (row) => {
      if (!row.image_path || !url || !key) return rowToPost(row);
      try {
        const response = await fetch(
          `${url}/functions/v1/signed-post-image?postId=${encodeURIComponent(row.id)}`,
          {
            headers: { apikey: key },
          },
        );
        const data = await response.json();
        return rowToPost(row, response.ok ? data.signedUrl : undefined);
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
