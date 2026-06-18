import { handleOptions } from "../_shared/cors.ts";
import { appError, json } from "../_shared/responses.ts";
import { createAdminClient, requireUser } from "../_shared/supabase.ts";
import { getIpHash } from "../_shared/request-identity.ts";
import { enforceRateLimits } from "../_shared/rate-limit.ts";
import { AppError } from "../_shared/app-error.ts";
import { detectImageType } from "../_shared/validators.ts";

const MAX_BYTES = 5 * 1024 * 1024;

Deno.serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;
  try {
    const user = await requireUser(req);
    const ipHash = await getIpHash(req);
    await enforceRateLimits([
      { key: `image-upload:user:${user.id}`, limit: 10, windowSeconds: 600 },
      { key: `image-upload:ip:${ipHash}`, limit: 30, windowSeconds: 3600 },
    ]);

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size <= 0 || file.size > MAX_BYTES) {
      throw new AppError(
        "invalid_image",
        "Please upload a valid JPG, PNG, or WEBP image up to 5 MB.",
      );
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const detected = detectImageType(bytes);
    const uploadId = crypto.randomUUID();
    const path = `${user.id}/temporary/${uploadId}.${detected.extension}`;
    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage
      .from("post-images")
      .upload(path, bytes, {
        contentType: detected.mimeType,
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const { error: recordError } = await admin.from("post_uploads").insert({
      id: uploadId,
      created_by: user.id,
      bucket: "post-images",
      path,
      original_name: file.name.slice(0, 255),
      mime_type: detected.mimeType,
      size_bytes: file.size,
    });
    if (recordError) {
      await admin.storage.from("post-images").remove([path]);
      throw recordError;
    }
    return json({ uploadId }, 201);
  } catch (cause) {
    return appError(cause, "Unable to upload image.");
  }
});
