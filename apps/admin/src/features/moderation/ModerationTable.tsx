"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Archive, Check, Filter, MapPin, RotateCcw, SlidersHorizontal, X, XCircle } from "lucide-react";
import { AdminModal } from "@/components/ui/admin-modal";
import { AdminLocationMap } from "@/features/locations/AdminLocationMap";
import { useLocationLabels } from "@/features/locations/use-location-labels";
import { useAdminRealtime } from "@/features/realtime/use-admin-realtime";
import { controlClass, dangerButtonClass, iconButtonClass, isWithinDateRange, panelClass, primaryButtonClass, secondaryButtonClass, textareaClass, toolButtonClass, type DateRange } from "@/lib/admin-list-utils";
import { archivePost, fetchPostsPage, moderatePost, restoreArchivedPost, softDeletePost } from "./admin-queries";
import { MusicCard, PostVisual } from "./PostVisual";
import type { PostRow } from "./types";

type Decision = "approved" | "rejected";
type ContentFilter = "all" | "text" | "photo" | "music" | "both";
type Sort = "newest" | "oldest" | "coordinates-asc" | "coordinates-desc" | "status";
type StatusFilter = PostRow["status"] | "all" | "soft_deleted";
const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "flagged", label: "Flagged" },
  { value: "archived", label: "Archived" },
  { value: "soft_deleted", label: "Soft deleted" },
  { value: "all", label: "All posts" },
];
const statusStyles: Record<PostRow["status"], string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  approved: "bg-green-50 text-green-800 ring-green-200",
  rejected: "bg-red-50 text-red-800 ring-red-200",
  flagged: "bg-red-50 text-red-800 ring-red-200",
  archived: "bg-slate-100 text-slate-700 ring-slate-200",
};

export function ModerationTable() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [content, setContent] = useState<ContentFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<PostRow | null>(null);
  const [reason, setReason] = useState("");
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [error, setError] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const locationLabel = useLocationLabels(posts);
  const searchParams = useSearchParams();
  const pageSize = 25;
  const load = useCallback(() => fetchPostsPage({ page, pageSize, status, query, content, dateRange, sort })
    .then(({ rows, count }) => { setPosts(rows); setTotal(count); })
    .catch(() => setError("Posts could not be loaded.")), [content, dateRange, page, query, sort, status]);

  useEffect(() => { void load(); }, [load]);
  useAdminRealtime(["posts"], load);
  useEffect(() => {
    const id = searchParams.get("post");
    if (id && posts.length) setSelected(posts.find((post) => post.id === id) ?? null);
  }, [posts, searchParams]);
  useEffect(() => {
    if (searchParams.get("status") === "archived") setStatus("archived");
  }, [searchParams]);

  const visible = useMemo(() => posts
    .filter((post) => {
      if (status === "soft_deleted") return Boolean(post.deleted_at);
      if (status !== "all" && post.deleted_at) return false;
      return status === "all" || post.status === status;
    })
    .filter((post) => `${post.title} ${post.body} ${post.place_name ?? ""}`.toLowerCase().includes(query.toLowerCase()))
    .filter((post) => isWithinDateRange(post.created_at, dateRange))
    .filter((post) => {
      const photo = Boolean(post.image_path);
      const music = Boolean(post.music);
      if (content === "text") return !photo && !music;
      if (content === "photo") return photo && !music;
      if (content === "music") return music && !photo;
      if (content === "both") return photo && music;
      return true;
    })
    .sort((a, b) => {
      if (sort === "oldest") return a.created_at.localeCompare(b.created_at);
      if (sort === "coordinates-asc") return `${a.lat},${a.lng}`.localeCompare(`${b.lat},${b.lng}`);
      if (sort === "coordinates-desc") return `${b.lat},${b.lng}`.localeCompare(`${a.lat},${a.lng}`);
      if (sort === "status") return a.status.localeCompare(b.status);
      return b.created_at.localeCompare(a.created_at);
    }), [content, dateRange, posts, query, sort, status]);

  async function decide(post: PostRow, nextStatus: Decision) {
    try {
      await moderatePost(post.id, nextStatus, reason);
      setSelected(null); setReason(""); await load();
    } catch { setError("Moderation action failed. Confirm admin RLS migration is applied."); }
  }

  async function archiveSelected() {
    if (!selected) return;
    try {
      await archivePost(selected.id, reason);
      setArchiveConfirm(false); setSelected(null); setReason(""); await load();
    } catch { setError("Post could not be archived."); }
  }

  async function softDeleteSelected() {
    if (!selected) return;
    try {
      await softDeletePost(selected.id, reason);
      setArchiveConfirm(false); setSelected(null); setReason(""); await load();
    } catch { setError("Post could not be soft deleted."); }
  }

  async function restoreSelected() {
    if (!selected) return;
    try {
      await restoreArchivedPost(selected.id);
      setSelected(null); setReason(""); await load();
    } catch { setError("Post could not be restored."); }
  }

  return (
    <section>
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-green-700">Posts</p><h1 className="mt-1 text-2xl font-semibold">Moderation</h1><p className="mt-1 text-xs text-slate-600">Review pending posts and keep public posts tidy.</p></div>
          <p className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">{total} results</p>
        </div>
        <div className="mt-4 grid gap-2 lg:grid-cols-[1fr_180px_auto_auto_auto]">
          <input aria-label="Search posts" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search post or place..." className={controlClass} />
          <select aria-label="Status" value={status} onChange={(event) => { setStatus(event.target.value as StatusFilter); setPage(1); }} className={controlClass}>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
          <div className="relative">
            <button type="button" onClick={() => { setFilterOpen((open) => !open); setSortOpen(false); }} className={`flex w-full items-center justify-center gap-2 ${toolButtonClass}`}><Filter className="size-4" />Filter</button>
            {filterOpen && <div className={panelClass}>
              <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">Content<select aria-label="Content type" value={content} onChange={(event) => { setContent(event.target.value as ContentFilter); setPage(1); }} className={`mt-2 w-full ${controlClass}`}><option value="all">All content</option><option value="text">Text only</option><option value="photo">Photo only</option><option value="music">Music only</option><option value="both">Photo + music</option></select></label>
              <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-muted-foreground">Date<select aria-label="Date range" value={dateRange} onChange={(event) => { setDateRange(event.target.value as DateRange); setPage(1); }} className={`mt-2 w-full ${controlClass}`}><option value="all">All time</option><option value="today">Today</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></select></label>
            </div>}
          </div>
          <div className="relative">
            <button type="button" onClick={() => { setSortOpen((open) => !open); setFilterOpen(false); }} className={`flex w-full items-center justify-center gap-2 ${toolButtonClass}`}><SlidersHorizontal className="size-4" />Sort</button>
            {sortOpen && <div className={panelClass}>
              <select aria-label="Sort posts" value={sort} onChange={(event) => { setSort(event.target.value as Sort); setPage(1); }} className={`w-full ${controlClass}`}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="coordinates-asc">Coordinates ascending</option><option value="coordinates-desc">Coordinates descending</option><option value="status">Status</option></select>
            </div>}
          </div>
          <button onClick={() => { setQuery(""); setStatus("pending"); setContent("all"); setDateRange("all"); setSort("newest"); setPage(1); }} className={toolButtonClass}>Reset</button>
        </div>
      </div>
      {error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}

      {/* Mobile card list */}
      <div className="mt-4 space-y-2 md:hidden">
        {visible.map((post) => (
          <button
            key={post.id}
            type="button"
            onClick={() => setSelected(post)}
            className="w-full rounded-2xl border border-border bg-surface p-3 text-left shadow-sm transition hover:bg-muted"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-sm font-semibold">{post.title}</p>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ring-1 ring-inset ${statusStyles[post.status]}`}>{post.deleted_at ? "soft deleted" : post.status}</span>
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{post.body}</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] text-muted-foreground">{locationLabel(post)}</span>
              <span className="text-[10px] text-muted-foreground">{new Date(post.created_at).toLocaleDateString()}</span>
            </div>
            {post.status === "pending" && !post.deleted_at && (
              <div className="mt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                <button type="button" aria-label="Reject" onClick={(e) => { e.stopPropagation(); void decide(post, "rejected"); }} className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border text-xs font-semibold border-danger text-danger hover:bg-danger-surface`}><X className="size-3.5" />Reject</button>
                <button type="button" aria-label="Approve" onClick={(e) => { e.stopPropagation(); void decide(post, "approved"); }} className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary-hover`}><Check className="size-3.5" />Approve</button>
              </div>
            )}
          </button>
        ))}
        {!visible.length && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No posts match these filters.</p>}
      </div>

      {/* Desktop table */}
      <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-[#dce3d8] bg-white shadow-sm md:block">
        <table className="w-full min-w-[860px] border-collapse text-left text-sm"><thead className="bg-[#f0f4ed] text-xs uppercase tracking-wide text-slate-600"><tr><th className="p-4">Post</th><th className="p-4">Location</th><th className="p-4">Media</th><th className="p-4">Status</th><th className="p-4">Created</th><th className="p-4 text-right">Actions</th></tr></thead><tbody>
          {visible.map((post) => <tr key={post.id} className="cursor-pointer border-t hover:bg-green-50/50" onClick={() => setSelected(post)}><td className="p-4"><p className="font-semibold">{post.title}</p><p className="mt-1 max-w-md truncate text-slate-600">{post.body}</p></td><td className="p-4 font-mono text-xs">{locationLabel(post)}</td><td className="p-4">{[post.image_path && "Photo", post.music && "Song"].filter(Boolean).join(" + ") || "Text"}</td><td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${statusStyles[post.status]}`}>{post.deleted_at ? "soft deleted" : post.status}</span></td><td className="p-4 text-slate-600">{new Date(post.created_at).toLocaleString()}</td><td className="p-4"><div className="flex justify-end gap-2">{post.status === "pending" && !post.deleted_at && <><button type="button" aria-label="Reject post" title="Reject post" onClick={(event) => { event.stopPropagation(); void decide(post, "rejected"); }} className={`${iconButtonClass} border-danger text-danger hover:bg-danger-surface`}><X className="size-4" /></button><button type="button" aria-label="Approve post" title="Approve post" onClick={(event) => { event.stopPropagation(); void decide(post, "approved"); }} className={`${iconButtonClass} border-primary bg-primary text-primary-foreground hover:bg-primary-hover`}><Check className="size-4" /></button></>}</div></td></tr>)}
        </tbody></table>
        {!visible.length && <p className="p-10 text-center text-sm text-slate-600">No posts match these filters.</p>}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>Page {page} of {Math.max(1, Math.ceil(total / pageSize))}</span>
        <div className="flex gap-2"><button type="button" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className={toolButtonClass}>Previous</button><button type="button" disabled={page >= Math.ceil(total / pageSize)} onClick={() => setPage((value) => value + 1)} className={toolButtonClass}>Next</button></div>
      </div>
      {selected && <AdminModal onClose={() => setSelected(null)}>
        <article role="dialog" aria-modal="true" aria-labelledby="post-detail-title" className="relative flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-surface shadow-2xl" onClick={(event) => event.stopPropagation()}>
          <header className="flex justify-between gap-4 border-b border-[#dce3d8] p-4 sm:p-6"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">{selected.deleted_at ? "soft deleted" : selected.status} post</p><h2 id="post-detail-title" className="mt-2 text-2xl font-semibold">{selected.title}</h2></div><button aria-label="Close post detail" onClick={() => setSelected(null)} className="grid size-10 place-items-center rounded-full border bg-white text-slate-600"><X className="size-4" /></button></header>
          <div className="min-h-0 overflow-y-auto p-4 sm:p-6">
            <div className="grid items-start gap-5 lg:grid-cols-[1.05fr_.95fr]">
              <div className="space-y-4">
                {selected.image_path && <PostVisual post={selected} />}
                <section className="rounded-2xl border border-[#dce3d8] bg-white p-5 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-green-700">Thought</p>
                  <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-foreground">{selected.body}</p>
                </section>
                {selected.music && <MusicCard post={selected} />}
              </div>
              <section className="rounded-2xl border border-[#dce3d8] bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2"><MapPin className="size-4 text-green-700" /><div><h3 className="text-sm font-semibold">Pinned coordinates</h3><p className="font-mono text-xs text-slate-600">{locationLabel(selected)}</p></div></div>
                <div className="h-72 overflow-hidden rounded-xl border border-[#dce3d8] bg-[#e7eee3]"><AdminLocationMap posts={[selected]} selectedId={selected.id} reportCounts={{}} onSelect={() => undefined} compact /></div>
              </section>
            </div>
            <section className="mt-5 rounded-2xl border border-[#dce3d8] bg-[#f0f4ed] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-green-700">Post details</p>
              <dl className="mt-3 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
                <div><dt className="text-xs font-medium text-slate-600">Coordinates</dt><dd className="mt-1 font-mono text-xs">{selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}</dd></div>
                <div><dt className="text-xs font-medium text-slate-600">Submitted</dt><dd className="mt-1">{new Date(selected.created_at).toLocaleString()}</dd></div>
                <div><dt className="text-xs font-medium text-slate-600">Attachments</dt><dd className="mt-1">{[selected.image_path && "Photo", selected.music && "Song"].filter(Boolean).join(" + ") || "None"}</dd></div>
              </dl>
            </section>
            <label className="mt-5 block text-sm font-medium">Moderation reason <span className="font-normal text-slate-600">Optional note shown only in admin history.</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} className={`mt-2 ${textareaClass}`} /></label>
          </div>
          {selected.status === "archived" && <footer className="flex justify-end border-t border-border bg-surface p-4 sm:px-6"><button onClick={() => void restoreSelected()} className={primaryButtonClass}><RotateCcw className="size-4" />{selected.deleted_at ? "Restore to archived" : "Restore and approve"}</button></footer>}
          {selected.status === "pending" && <footer className="grid gap-2 border-t border-border bg-surface p-4 backdrop-blur sm:grid-cols-2 sm:px-6"><button onClick={() => void decide(selected, "rejected")} className={`${secondaryButtonClass} border-danger text-danger hover:bg-danger-surface`}><XCircle className="size-4" />Reject</button><button onClick={() => void decide(selected, "approved")} className={primaryButtonClass}><Check className="size-4" />Approve</button></footer>}
          {(selected.status === "approved" || selected.status === "flagged") && <footer className="flex justify-end border-t border-border bg-surface p-4 sm:px-6"><button onClick={() => setArchiveConfirm(true)} className={`${secondaryButtonClass} border-danger text-danger hover:bg-danger-surface`}><Archive className="size-4" />Archive post</button></footer>}
          {archiveConfirm && <div className="absolute inset-0 z-10 grid place-items-center bg-black/50 p-4" onClick={() => setArchiveConfirm(false)}><section role="alertdialog" aria-modal="true" aria-labelledby="archive-title" className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}><h3 id="archive-title" className="text-lg font-semibold">Archive this post?</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Post leaves the public map. Soft delete keeps it archived with deleted metadata.</p><div className="mt-5 flex flex-wrap justify-end gap-2"><button onClick={() => setArchiveConfirm(false)} className={secondaryButtonClass}>Cancel</button><button onClick={() => void softDeleteSelected()} className={`${secondaryButtonClass} border-danger text-danger hover:bg-danger-surface`}>Soft delete</button><button onClick={() => void archiveSelected()} className={dangerButtonClass}>Archive post</button></div></section></div>}
        </article>
      </AdminModal>}
    </section>
  );
}
