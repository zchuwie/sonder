import { handleOptions } from "../_shared/cors.ts";
import { appError, json, error } from "../_shared/responses.ts";
import { createAdminClient, requireUser } from "../_shared/supabase.ts";
import { getIpHash } from "../_shared/request-identity.ts";
import { enforceRateLimits } from "../_shared/rate-limit.ts";
import { validateMusic } from "../_shared/validators.ts";
import { verifyTurnstile } from "../_shared/turnstile.ts";
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
    const ipHash = await getIpHash(req);
    await enforceRateLimits([
      { key: `create-post:user:${user.id}`, limit: 5, windowSeconds: 600 },
      { key: `create-post:ip:${ipHash}`, limit: 20, windowSeconds: 3600 },
    ]);
    const input = await req.json();

    // Turnstile bot verification
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const turnstile = await verifyTurnstile(input.turnstileToken, user.id, clientIp);
    if (!turnstile.ok) {
      return error(turnstile.error ?? "Bot verification failed.", 403);
    }

    const title = requiredString(input.title, "title", 50);
    const body = requiredString(input.body, "body", 1000);
    const lat = coordinate(input.lat, "lat");
    const lng = coordinate(input.lng, "lng");
    const imagePath = typeof input.imagePath === "string" ? input.imagePath.slice(0, 500) : null;
    if (imagePath && !imagePath.startsWith(`${user.id}/`)) {
      return new Response("Forbidden", { status: 403 });
    }
    const music = validateMusic(input.music);

    const admin = createAdminClient();
    const { data: post, error: insertError } = await admin
      .from("posts")
      .insert({
        title,
        body,
        lat,
        lng,
        place_name: optionalString(input.placeName, "placeName", 200),
        group_key: groupKey(lat, lng),
        image_path: imagePath,
        music,
        status: "pending",
        created_by: user.id,
      })
      .select("id, status")
      .single();
    if (insertError) throw insertError;

    // Log submission event
    await admin.from("moderation_events").insert({
      post_id: post.id,
      action: "submitted",
      actor_id: user.id,
    });

    return json({ postId: post.id, status: post.status }, 201);
  } catch (cause) {
    return appError(cause, "Unable to create post.");
  }
});
