import { FunctionsHttpError } from "@supabase/supabase-js";

type FunctionErrorPayload = {
  error?: string;
  message?: string;
};

const FRIENDLY_MESSAGES: Record<string, string> = {
  rate_limited: "Too many attempts. Please try again later.",
  already_reported: "You have already reported this post.",
  invalid_music: "This song attachment is invalid. Please choose another song.",
  invalid_image: "Please upload a valid JPG, PNG, or WEBP image.",
  upload_expired: "This upload expired. Please upload the image again.",
  rate_limit_unavailable:
    "Request protection is unavailable. Please try again later.",
};

export async function getFunctionErrorMessage(
  error: unknown,
  fallback: string,
): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const payload = (await error.context.json()) as FunctionErrorPayload;
      return (
        (payload.error && FRIENDLY_MESSAGES[payload.error]) ||
        payload.message ||
        fallback
      );
    } catch {
      return fallback;
    }
  }
  return error instanceof Error ? error.message : fallback;
}
