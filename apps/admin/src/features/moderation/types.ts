import type { Database, Json } from "@/lib/supabase/database.types";

export type PostRow = Database["public"]["Tables"]["posts"]["Row"];
export type ReportRow = Database["public"]["Tables"]["post_reports"]["Row"];
export type AuditRow = Database["public"]["Tables"]["moderation_events"]["Row"];

export type MusicMetadata = {
  providerId?: string;
  title?: string;
  artist?: string;
  album?: string;
  coverUrl?: string;
  previewUrl?: string;
  deezerUrl?: string;
};

export function getMusic(value: Json | null): MusicMetadata | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as MusicMetadata)
    : null;
}
