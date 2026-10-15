import { LandingPage } from "@/features/landing/components/LandingPage";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  if (!supabase) return <LandingPage postPreviews={[]} postsUnavailable />;

  const { data, error } = await supabase
    .from("posts")
    .select("id, title, body, place_name, lat, lng, music")
    .eq("status", "approved")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(6);

  const postPreviews = (data ?? []).map(({ music, ...post }) => ({
    ...post,
    music:
      music && typeof music === "object" && !Array.isArray(music) &&
      typeof music.title === "string"
        ? {
            title: music.title,
            artist: typeof music.artist === "string" ? music.artist : null,
          }
        : null,
  }));

  return <LandingPage postPreviews={postPreviews} postsUnavailable={!!error} />;
}
