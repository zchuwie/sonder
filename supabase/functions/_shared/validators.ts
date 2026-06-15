import { AppError } from "./app-error.ts";
import { optionalString, requiredString } from "./validation.ts";

const MAX_MUSIC_BYTES = 4096;

function optionalHttpsUrl(value: unknown, field: string): string | null {
  const text = optionalString(value, field, 500);
  if (!text) return null;
  try {
    const url = new URL(text);
    if (url.protocol !== "https:") throw new Error();
    return url.toString();
  } catch {
    throw new AppError("invalid_music", "Invalid music attachment.");
  }
}

export function validateMusic(value: unknown) {
  if (value == null) return null;
  let serialized: string;
  try {
    serialized = JSON.stringify(value);
  } catch {
    throw new AppError("invalid_music", "Invalid music attachment.");
  }
  if (serialized.length > MAX_MUSIC_BYTES || typeof value !== "object") {
    throw new AppError("invalid_music", "Invalid music attachment.");
  }
  const music = value as Record<string, unknown>;
  if (music.provider !== "deezer") {
    throw new AppError("invalid_music", "Invalid music attachment.");
  }
  try {
    return {
      provider: "deezer",
      providerId: requiredString(
        music.providerId ?? music.id,
        "music.providerId",
        80,
      ),
      title: requiredString(music.title, "music.title", 160),
      artist: requiredString(music.artist, "music.artist", 160),
      album: optionalString(music.album, "music.album", 160),
      previewUrl: optionalHttpsUrl(music.previewUrl, "music.previewUrl"),
      coverUrl: optionalHttpsUrl(music.coverUrl, "music.coverUrl"),
      deezerUrl: optionalHttpsUrl(
        music.deezerUrl ?? music.externalUrl,
        "music.deezerUrl",
      ),
      duration:
        typeof music.duration === "number" &&
        Number.isInteger(music.duration) &&
        music.duration >= 0 &&
        music.duration <= 86400
          ? music.duration
          : null,
    };
  } catch (cause) {
    if (cause instanceof AppError) throw cause;
    throw new AppError("invalid_music", "Invalid music attachment.");
  }
}

export function detectImageType(bytes: Uint8Array) {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return { mimeType: "image/jpeg", extension: "jpg" };
  }
  if (
    bytes.length >= 8 &&
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
      (value, index) => bytes[index] === value,
    )
  ) {
    return { mimeType: "image/png", extension: "png" };
  }
  if (
    bytes.length >= 12 &&
    new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
    new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP"
  ) {
    return { mimeType: "image/webp", extension: "webp" };
  }
  throw new AppError(
    "invalid_image",
    "Please upload a valid JPG, PNG, or WEBP image.",
  );
}
