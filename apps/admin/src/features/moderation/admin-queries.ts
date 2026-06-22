"use client";

import { createClient } from "@/lib/supabase/browser";
import type { AuditRow, PostRow, ReportRow } from "./types";

type DateRange = "all" | "today" | "7d" | "30d";
type PostListOptions = {
  page?: number;
  pageSize?: number;
  status?: PostRow["status"] | "all" | "soft_deleted";
  query?: string;
  content?: "all" | "text" | "photo" | "music" | "both";
  dateRange?: DateRange;
  sort?: "newest" | "oldest" | "coordinates-asc" | "coordinates-desc" | "status";
};
type ReportListOptions = {
  page?: number;
  pageSize?: number;
  status?: ReportRow["status"] | "all";
  query?: string;
  reason?: string;
  dateRange?: DateRange;
  sort?: "newest" | "oldest" | "count" | "reason";
};
type AuditListOptions = {
  page?: number;
  pageSize?: number;
  action?: string;
  query?: string;
  dateRange?: DateRange;
  sort?: "newest" | "oldest" | "action";
};

function rangeFor(page = 1, pageSize = 25) {
  const from = Math.max(0, page - 1) * pageSize;
  return { from, to: from + pageSize - 1 };
}

function since(range: DateRange = "all") {
  if (range === "all") return "";
  const date = new Date();
  if (range === "today") date.setHours(0, 0, 0, 0);
  else date.setDate(date.getDate() - (range === "7d" ? 7 : 30));
  return date.toISOString();
}

export async function fetchPostsPage(options: PostListOptions = {}) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const pageSize = options.pageSize ?? 50;
  const { from, to } = rangeFor(options.page, pageSize);
  let query = supabase
    .from("posts")
    .select("*", { count: "exact" });
  if (options.status === "soft_deleted") query = query.not("deleted_at", "is", null);
  else {
    if (options.status && options.status !== "all") query = query.eq("status", options.status);
    if (options.status !== "all") query = query.is("deleted_at", null);
  }
  if (options.query?.trim()) {
    const term = options.query.trim().replaceAll("%", "\\%");
    query = query.or(`title.ilike.%${term}%,body.ilike.%${term}%,place_name.ilike.%${term}%`);
  }
  if (options.content === "text") query = query.is("image_path", null).is("music", null);
  if (options.content === "photo") query = query.not("image_path", "is", null).is("music", null);
  if (options.content === "music") query = query.is("image_path", null).not("music", "is", null);
  if (options.content === "both") query = query.not("image_path", "is", null).not("music", "is", null);
  const after = since(options.dateRange);
  if (after) query = query.gte("created_at", after);
  if (options.sort === "oldest") query = query.order("created_at", { ascending: true });
  else if (options.sort === "coordinates-asc") query = query.order("lat", { ascending: true }).order("lng", { ascending: true });
  else if (options.sort === "coordinates-desc") query = query.order("lat", { ascending: false }).order("lng", { ascending: false });
  else if (options.sort === "status") query = query.order("status", { ascending: true }).order("created_at", { ascending: false });
  else query = query.order("created_at", { ascending: false });
  const { data, error, count } = await query.range(from, to);
  if (error) throw error;
  return { rows: (data ?? []) as PostRow[], count: count ?? 0 };
}

export async function fetchReportsPage(options: ReportListOptions = {}) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const pageSize = options.pageSize ?? 50;
  const { from, to } = rangeFor(options.page, pageSize);
  let query = supabase
    .from("post_reports")
    .select("*", { count: "exact" });
  if (options.status && options.status !== "all") query = query.eq("status", options.status);
  if (options.reason && options.reason !== "all") query = query.eq("reason", options.reason);
  if (options.query?.trim()) {
    const term = options.query.trim().replaceAll("%", "\\%");
    query = query.or(`reason.ilike.%${term}%,details.ilike.%${term}%`);
  }
  const after = since(options.dateRange);
  if (after) query = query.gte("created_at", after);
  if (options.sort === "oldest") query = query.order("created_at", { ascending: true });
  else if (options.sort === "reason") query = query.order("reason", { ascending: true }).order("created_at", { ascending: false });
  else query = query.order("created_at", { ascending: false });
  const { data, error, count } = await query.range(from, to);
  if (error) throw error;
  return { rows: (data ?? []) as ReportRow[], count: count ?? 0 };
}

export async function fetchPosts() {
  return (await fetchPostsPage({ pageSize: 500 })).rows;
}

export async function fetchReports() {
  return (await fetchReportsPage({ pageSize: 500 })).rows;
}

export async function fetchAuditHistory() {
  return (await fetchAuditHistoryPage({ pageSize: 50 })).rows;
}

export async function fetchAuditHistoryPage(options: AuditListOptions = {}) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const pageSize = options.pageSize ?? 25;
  const { from, to } = rangeFor(options.page, pageSize);
  const term = options.query?.trim().replaceAll("%", "\\%");
  let matchedPostIds: string[] = [];
  if (term) {
    const { data: posts, error: postSearchError } = await supabase
      .from("posts")
      .select("id")
      .or(`title.ilike.%${term}%,body.ilike.%${term}%,place_name.ilike.%${term}%`)
      .limit(100);
    if (postSearchError) throw postSearchError;
    matchedPostIds = (posts ?? []).map((post) => post.id);
  }
  let query = supabase
    .from("moderation_events")
    .select("*", { count: "exact" });
  if (options.action && options.action !== "all") query = query.eq("action", options.action);
  const after = since(options.dateRange);
  if (after) query = query.gte("created_at", after);
  if (term) {
    const filters = [`action.ilike.%${term}%`, `reason.ilike.%${term}%`];
    if (/^[0-9a-f-]{12,}$/i.test(term)) filters.push(`id.eq.${term}`, `post_id.eq.${term}`, `actor_id.eq.${term}`);
    if (matchedPostIds.length) filters.push(`post_id.in.(${matchedPostIds.join(",")})`);
    query = query.or(filters.join(","));
  }
  if (options.sort === "oldest") query = query.order("created_at", { ascending: true });
  else if (options.sort === "action") query = query.order("action", { ascending: true }).order("created_at", { ascending: false });
  else query = query.order("created_at", { ascending: false });
  const { data, error, count } = await query.range(from, to);
  if (error) throw error;
  const rows = (data ?? []) as AuditRow[];
  const postIds = [...new Set(rows.map((event) => event.post_id).filter(Boolean))] as string[];
  const { data: posts, error: postsError } = postIds.length
    ? await supabase.from("posts").select("*").in("id", postIds)
    : { data: [], error: null };
  if (postsError) throw postsError;
  return { rows, posts: (posts ?? []) as PostRow[], count: count ?? 0 };
}

export async function moderatePost(
  postId: string,
  status: "approved" | "rejected" | "flagged",
  reason?: string,
) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("posts")
    .update({
      status,
      status_updated_at: now,
      moderation_reason: reason?.trim() || null,
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
      status: "archived",
      status_updated_at: now,
      deleted_at: null,
      delete_reason: null,
      moderation_reason: reason?.trim() || "Archived by admin",
    })
    .eq("id", postId);
  if (error) throw error;
}

export async function restoreArchivedPost(postId: string) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data: post, error: selectError } = await supabase
    .from("posts")
    .select("deleted_at")
    .eq("id", postId)
    .maybeSingle();
  if (selectError) throw selectError;
  const { error } = await supabase
    .from("posts")
    .update({
      status: post?.deleted_at ? "archived" : "approved",
      status_updated_at: new Date().toISOString(),
      deleted_at: null,
      delete_reason: null,
      moderation_reason: post?.deleted_at
        ? "Restored from soft delete"
        : "Restored and approved",
    })
    .eq("id", postId)
    .eq("status", "archived");
  if (error) throw error;
}

export async function softDeletePost(postId: string, reason?: string) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("posts")
    .update({
      status: "archived",
      status_updated_at: now,
      deleted_at: now,
      delete_reason: reason?.trim() || "Soft deleted by admin",
      moderation_reason: reason?.trim() || "Soft deleted by admin",
    })
    .eq("id", postId);
  if (error) throw error;
}

export async function updateReportStatus(
  reportId: string,
  status: "reviewing" | "resolved" | "dismissed" | "actioned",
) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase
    .from("post_reports")
    .update({ status })
    .eq("id", reportId);
  if (error) throw error;
}

export async function dismissReport(reportId: string, postId: string) {
  const supabase = createClient();
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error: reportError } = await supabase
    .from("post_reports")
    .update({ status: "dismissed" })
    .eq("id", reportId);
  if (reportError) throw reportError;
  // Best-effort: restore post to approved if it was flagged (ignore failures)
  try {
    await supabase
      .from("posts")
      .update({
        status: "approved",
        moderation_reason: "Report dismissed",
      })
      .eq("id", postId)
      .eq("status", "flagged")
      .is("deleted_at", null);
  } catch {
    // Post may be deleted or already approved — that's fine
  }
}

// ponytail: in-memory cache for signed URLs. TTL 50 min (signed URLs valid 1h).
const imageUrlCache = new Map<string, { url: string; expires: number }>();
const IMAGE_CACHE_TTL = 50 * 60_000;

export async function createPostImageUrl(imagePath: string) {
  const cached = imageUrlCache.get(imagePath);
  if (cached && cached.expires > Date.now()) return cached.url;

  const supabase = createClient();
  if (!supabase) return "";
  const { data } = await supabase.storage
    .from("post-images")
    .createSignedUrl(imagePath, 3600);
  const url = data?.signedUrl ?? "";
  if (url) imageUrlCache.set(imagePath, { url, expires: Date.now() + IMAGE_CACHE_TTL });
  return url;
}
