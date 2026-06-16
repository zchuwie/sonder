"use client";

import { createClient } from "@/lib/supabase/browser";
import type { AuditRow, PostRow, ReportRow } from "./types";

export async function fetchPosts() {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PostRow[];
}

export async function fetchReports() {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from("post_reports")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ReportRow[];
}

export async function fetchAuditHistory() {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase
    .from("moderation_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as AuditRow[];
}

export async function moderatePost(
  postId: string,
  status: "visible" | "rejected" | "hidden",
  reason?: string,
) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const now = new Date().toISOString();
  const timestamps =
    status === "visible"
      ? { approved_at: now, rejected_at: null, hidden_at: null }
      : status === "rejected"
        ? { rejected_at: now, approved_at: null, hidden_at: now }
        : { hidden_at: now };
  const { error } = await supabase
    .from("posts")
    .update({
      status,
      moderation_reason: reason?.trim() || null,
      ...timestamps,
    })
    .eq("id", postId);
  if (error) throw error;
}

export async function archivePost(postId: string, reason?: string) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("posts")
    .update({
      status: "hidden",
      hidden_at: now,
      archived_at: now,
      moderation_reason: reason?.trim() || "Archived by admin",
    })
    .eq("id", postId);
  if (error) throw error;
}

export async function restoreArchivedPost(postId: string) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase
    .from("posts")
    .update({
      status: "pending",
      archived_at: null,
      hidden_at: null,
      moderation_reason: "Restored from archive for review",
    })
    .eq("id", postId)
    .not("archived_at", "is", null);
  if (error) throw error;
}

export async function updateReportStatus(
  reportId: string,
  status: "reviewed" | "dismissed" | "actioned",
) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase
    .from("post_reports")
    .update({ status })
    .eq("id", reportId);
  if (error) throw error;
}

export async function createPostImageUrl(imagePath: string) {
  const supabase = createClient();
  if (!supabase) return "";
  const { data } = await supabase.storage
    .from("post-images")
    .createSignedUrl(imagePath, 600);
  return data?.signedUrl ?? "";
}
