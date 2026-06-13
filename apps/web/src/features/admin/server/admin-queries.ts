import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { rowToPost } from "@/features/posts/lib/post-mappers";
import type { MarkerData } from "@/features/posts/lib/post-types";
import type { PostRow } from "@/features/posts/lib/post-mappers";
import type { Database } from "@/lib/supabase/database.types";
import { groupMarkersByLocation } from "@/features/posts/lib/post-utils";

type ReportRow = Database["public"]["Tables"]["post_reports"]["Row"];

export async function getAdminMarkers(): Promise<MarkerData[] | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return null;
  const posts = await Promise.all(
    ((data ?? []) as PostRow[]).map(async (row) => {
      const signed = row.image_path
        ? await supabase.storage
            .from("post-images")
            .createSignedUrl(row.image_path, 3600)
        : null;
      return rowToPost(row, signed?.data?.signedUrl);
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

export async function getAdminReports() {
  const supabase = createAdminClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("post_reports")
    .select("*")
    .order("created_at", { ascending: false });
  return error ? null : (data as ReportRow[]);
}
