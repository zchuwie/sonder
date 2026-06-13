import { handleOptions } from "../_shared/cors.ts";
import { error, json } from "../_shared/responses.ts";
import { createAdminClient, requireUser } from "../_shared/supabase.ts";
import {
  coordinate,
  groupKey,
  optionalString,
  requiredString,
} from "../_shared/validation.ts";

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  try {
    const user = await requireUser(req);
    const input = await req.json();
    const title = requiredString(input.title, "title", 80);
    const body = requiredString(input.body, "body", 1000);
    const lat = coordinate(input.lat, "lat");
    const lng = coordinate(input.lng, "lng");
    const imagePath = optionalString(input.imagePath, "imagePath", 500);
    if (imagePath && !imagePath.startsWith(`${user.id}/`))
      throw new Error("Image path is not owned by this session");

    const { data, error: insertError } = await createAdminClient()
      .from("posts")
      .insert({
        title,
        body,
        lat,
        lng,
        place_name: optionalString(input.placeName, "placeName", 200),
        group_key: groupKey(lat, lng),
        image_path: imagePath,
        music: input.music ?? null,
        status: "pending",
        created_by: user.id,
      })
      .select("id,status")
      .single();
    if (insertError) throw insertError;
    return json({ postId: data.id, status: data.status }, 201);
  } catch (cause) {
    return error(
      cause instanceof Error ? cause.message : "Unable to create post",
      400,
    );
  }
});
