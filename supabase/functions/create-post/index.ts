import { handleOptions } from "../_shared/cors.ts";
import { appError, json } from "../_shared/responses.ts";
import { createAdminClient, requireUser } from "../_shared/supabase.ts";
import { getIpHash } from "../_shared/request-identity.ts";
import { enforceRateLimits } from "../_shared/rate-limit.ts";
import { validateMusic } from "../_shared/validators.ts";
import {
  coordinate,
  groupKey,
  optionalString,
  optionalUuid,
  requiredString,
} from "../_shared/validation.ts";

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  try {
    const user = await requireUser(req);
    const ipHash = await getIpHash(req);
    await enforceRateLimits([
      { key: `create-post:user:${user.id}`, limit: 5, windowSeconds: 600 },
      { key: `create-post:ip:${ipHash}`, limit: 20, windowSeconds: 3600 },
    ]);
    const input = await req.json();
    const title = requiredString(input.title, "title", 80);
    const body = requiredString(input.body, "body", 1000);
    const lat = coordinate(input.lat, "lat");
    const lng = coordinate(input.lng, "lng");
    const uploadId = optionalUuid(input.uploadId, "uploadId");
    const music = validateMusic(input.music);

    const { data, error: insertError } = await createAdminClient()
      .rpc("create_post_with_upload", {
        p_title: title,
        p_body: body,
        p_lat: lat,
        p_lng: lng,
        p_place_name: optionalString(input.placeName, "placeName", 200),
        p_group_key: groupKey(lat, lng),
        p_music: music,
        p_created_by: user.id,
        p_upload_id: uploadId,
      })
      .single();
    if (insertError?.message.includes("upload_unavailable")) {
      throw new AppError(
        "upload_expired",
        "Image upload expired. Please upload it again.",
      );
    }
    if (insertError) throw insertError;
    return json({ postId: data.post_id, status: data.post_status }, 201);
  } catch (cause) {
    return appError(cause, "Unable to create post.");
  }
});
