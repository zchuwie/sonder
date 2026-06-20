"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive,
  Check,
  Filter,
  MapPin,
  Music2,
  RotateCcw,
  SlidersHorizontal,
  X,
  XCircle,
} from "lucide-react";
import { AdminLocationMap } from "@/features/locations/AdminLocationMap";
import { AdminModal } from "@/components/ui/admin-modal";
import {
  archivePost,
  fetchPostsPage,
  fetchReportsPage,
  moderatePost,
  restoreArchivedPost,
  softDeletePost,
} from "@/features/moderation/admin-queries";
import { MusicCard, PostVisual } from "@/features/moderation/PostVisual";
import type { PostRow } from "@/features/moderation/types";
import { useAdminRealtime } from "@/features/realtime/use-admin-realtime";
import {
  controlClass,
  dangerButtonClass,
  isWithinDateRange,
  panelClass,
  primaryButtonClass,
  secondaryButtonClass,
  textareaClass,
  toolButtonClass,
  type DateRange,
} from "@/lib/admin-list-utils";

type StatusFilter = PostRow["status"] | "all";
type Sort = "newest" | "oldest" | "most-reported" | "status" | "coordinates-asc";
type ContentFilter = "all" | "text" | "photo" | "music";

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All posts" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "flagged", label: "Flagged" },
  { value: "archived", label: "Archived" },
];

const statusStyles: Record<PostRow["status"], string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  approved: "bg-green-50 text-green-800 ring-green-200",
  rejected: "bg-red-50 text-red-800 ring-red-200",
  flagged: "bg-red-50 text-red-800 ring-red-200",
  archived: "bg-slate-100 text-slate-700 ring-slate-200",
};

export function LocationsWorkspace() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [reportCounts, setReportCounts] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<StatusFilter>("all");
  const [content, setContent] = useState<ContentFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [query, setQuery] = useState("");
  const [total, setTotal] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<PostRow | null>(null);
  const [reason, setReason] = useState("");
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [error, setError] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [postResult, reportResult] = await Promise.all([
        fetchPostsPage({ pageSize: 500, status, sort: sort === "most-reported" ? "newest" : sort === "coordinates-asc" ? "coordinates-asc" : sort }),
        fetchReportsPage({ pageSize: 500, status: "all" }),
      ]);
      setPosts(postResult.rows);
      setTotal(postResult.count);
      const counts: Record<string, number> = {};
      for (const report of reportResult.rows) {
        if (report.post_id) counts[report.post_id] = (counts[report.post_id] ?? 0) + 1;
      }
      setReportCounts(counts);
      setError("");
    } catch {
      setError("Locations could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [sort, status]);

  useEffect(() => { void load(); }, [load]);
  useAdminRealtime(["posts", "post_reports"], load);

  const visible = useMemo(() => posts
    .filter((post) => status === "all" || post.status === status)
    .filter((post) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        post.title?.toLowerCase().includes(q) ||
        post.body?.toLowerCase().includes(q) ||
        post.place_name?.toLowerCase().includes(q) ||
        `${post.lat.toFixed(4)},${post.lng.toFixed(4)}`.includes(q)
      );
    })
    .filter((post) => isWithinDateRange(post.created_at, dateRange))
    .filter((post) => {
      const photo = Boolean(post.image_path);
      const music = Boolean(post.music);
      if (content === "text") return !photo && !music;
      if (content === "photo") return photo;
      if (content === "music") return music;
      return true;
    })
    .sort((a, b) => {
      if (sort === "oldest") return a.created_at.localeCompare(b.created_at);
      if (sort === "most-reported") return (reportCounts[b.id] ?? 0) - (reportCounts[a.id] ?? 0);
      if (sort === "status") return a.status.localeCompare(b.status);
      if (sort === "coordinates-asc") return `${a.lat},${a.lng}`.localeCompare(`${b.lat},${b.lng}`);
      return b.created_at.localeCompare(a.created_at);
    }),
  [content, dateRange, posts, query, reportCounts, sort, status]);

  function selectPost(post: PostRow) {
    setSelectedId(post.id);
    setSelected(post);
  }

  function reset() {
    setQuery(""); setStatus("all"); setContent("all"); setDateRange("all"); setSort("newest");
  }

  async function decide(post: PostRow, nextStatus: "approved" | "rejected") {
    try {
      await moderatePost(post.id, nextStatus, reason);
      setSelected(null); setReason(""); await load();
    } catch { setError("Moderation action failed."); }
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

  const reportedCount = Object.values(reportCounts).filter((n) => n > 0).length;
  const uniqueLocations = new Set(visible.map((p) => `${p.lat.toFixed(3)},${p.lng.toFixed(3)}`)).size;

  return (
    <section className="admin-soft-in">
      {/* ═══ DESKTOP layout (md+) — original side-by-side ═══ */}
      <div className="hidden md:flex md:flex-col md:gap-3">
      {/* Header + toolbar */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-700">Map review</p>
            <h1 className="mt-1 text-2xl font-semibold md:text-3xl">Locations</h1>
            <p className="mt-1 text-sm text-muted-foreground">Browse and review posts by location on the map.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">{total} posts</span>
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">{uniqueLocations} locations</span>
            {reportedCount > 0 && (
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-800 ring-1 ring-inset ring-red-200">
                {reportedCount} reported
              </span>
            )}
          </div>
        </div>
        <div className="mt-4 grid gap-2 lg:grid-cols-[1fr_180px_auto_auto_auto]">
          <input
            aria-label="Search locations"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, place, or coordinates..."
            className={controlClass}
          />
          <select
            aria-label="Status"
            value={status}
            onChange={(e) => { setStatus(e.target.value as StatusFilter); }}
            className={controlClass}
          >
            {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {/* Filter popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setFilterOpen((v) => !v); setSortOpen(false); }}
              className={`flex w-full items-center justify-center gap-2 ${toolButtonClass}`}
            >
              <Filter className="size-4" />Filter
            </button>
            {filterOpen && (
              <div className={panelClass}>
                <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Content
                  <select aria-label="Content type" value={content} onChange={(e) => setContent(e.target.value as ContentFilter)} className={`mt-2 w-full ${controlClass}`}>
                    <option value="all">All content</option>
                    <option value="text">Text only</option>
                    <option value="photo">Has photo</option>
                    <option value="music">Has music</option>
                  </select>
                </label>
                <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  Date
                  <select aria-label="Date range" value={dateRange} onChange={(e) => setDateRange(e.target.value as DateRange)} className={`mt-2 w-full ${controlClass}`}>
                    <option value="all">All time</option>
                    <option value="today">Today</option>
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                  </select>
                </label>
              </div>
            )}
          </div>
          {/* Sort popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => { setSortOpen((v) => !v); setFilterOpen(false); }}
              className={`flex w-full items-center justify-center gap-2 ${toolButtonClass}`}
            >
              <SlidersHorizontal className="size-4" />Sort
            </button>
            {sortOpen && (
              <div className={panelClass}>
                <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={`w-full ${controlClass}`}>
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="most-reported">Most reported</option>
                  <option value="status">Status</option>
                  <option value="coordinates-asc">Coordinates A→Z</option>
                </select>
              </div>
            )}
          </div>
          <button type="button" onClick={reset} className={toolButtonClass}>Reset</button>
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-red-700">{error}</p>
      )}

      {/* Split workspace — stacked on mobile, side-by-side on lg */}
      <div className="grid gap-3 lg:grid-cols-[360px_1fr] lg:h-[calc(100dvh-14rem)]">
        {/* Left: scrollable results list */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm lg:h-full" style={{ minHeight: "320px" }}>
          {/* Panel header */}
          <div className="shrink-0 border-b border-border px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-700">Posts</p>
            <p className="text-sm font-semibold text-foreground">{visible.length} location{visible.length !== 1 ? "s" : ""}</p>
          </div>

          {/* Scrollable cards */}
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {loading && (
              <div className="space-y-2 p-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-muted" />
                ))}
              </div>
            )}
            {!loading && visible.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                <MapPin className="size-8 text-muted-foreground opacity-40" />
                <p className="font-semibold">No matching locations</p>
                <p className="text-sm text-muted-foreground">Try clearing filters, changing the status, or searching nearby.</p>
                <button type="button" onClick={reset} className={secondaryButtonClass}>Clear filters</button>
              </div>
            )}
            {!loading && visible.map((post) => {
              const isSelected = selectedId === post.id;
              const reports = reportCounts[post.id] ?? 0;
              return (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => selectPost(post)}
                  className={`mb-1.5 w-full rounded-xl border p-3 text-left transition ${
                    isSelected
                      ? "border-primary bg-accent shadow-sm"
                      : "border-border bg-surface-elevated hover:bg-muted"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-semibold leading-tight">{post.title || "Untitled"}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ring-1 ring-inset ${statusStyles[post.status]}`}>
                      {post.status}
                    </span>
                  </div>
                  {post.place_name && (
                    <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <MapPin className="size-3 shrink-0" />{post.place_name}
                    </p>
                  )}
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                    {post.lat.toFixed(4)}, {post.lng.toFixed(4)}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    {reports > 0 && (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 ring-1 ring-inset ring-red-200">
                        {reports} report{reports !== 1 ? "s" : ""}
                      </span>
                    )}
                    {post.image_path && <span className="text-[10px] text-muted-foreground">Photo</span>}
                    {post.music && <Music2 className="size-3 text-muted-foreground" />}
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: map */}
        <div className="h-[380px] overflow-hidden rounded-2xl border border-border shadow-sm lg:h-full">
          <AdminLocationMap
            posts={visible}
            selectedId={selectedId}
            reportCounts={reportCounts}
            onSelect={(id) => {
              const post = visible.find((p) => p.id === id);
              if (post) selectPost(post);
            }}
          />
        </div>
      </div>

      {/* Detail modal */}
      {selected && (
        <AdminModal onClose={() => { setSelected(null); setSelectedId(null); }}>
          <article
            role="dialog"
            aria-modal="true"
            aria-labelledby="loc-detail-title"
            className="relative flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-surface shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex justify-between gap-4 border-b border-border p-4 sm:p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">
                  {selected.status} post
                </p>
                <h2 id="loc-detail-title" className="mt-2 text-2xl font-semibold">{selected.title}</h2>
              </div>
              <button
                aria-label="Close post detail"
                onClick={() => { setSelected(null); setSelectedId(null); }}
                className="grid size-10 place-items-center rounded-full border bg-surface-elevated text-muted-foreground"
              >
                <X className="size-4" />
              </button>
            </header>

            <div className="min-h-0 overflow-y-auto p-4 sm:p-6">
              <div className="grid items-start gap-5 lg:grid-cols-[1.05fr_.95fr]">
                <div className="space-y-4">
                  {selected.image_path && <PostVisual post={selected} />}
                  <section className="rounded-2xl border border-border bg-surface-elevated p-5 shadow-sm">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-green-700">Thought</p>
                    <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7">{selected.body}</p>
                  </section>
                  {selected.music && <MusicCard post={selected} />}
                </div>
                <section className="rounded-2xl border border-border bg-surface-elevated p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <MapPin className="size-4 text-green-700" />
                    <div>
                      <h3 className="text-sm font-semibold">Pinned location</h3>
                      <p className="font-mono text-xs text-muted-foreground">
                        {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}
                      </p>
                    </div>
                  </div>
                  <div className="h-72 overflow-hidden rounded-xl border border-border bg-accent">
                    <AdminLocationMap
                      posts={[selected]}
                      selectedId={selected.id}
                      reportCounts={reportCounts}
                      onSelect={() => undefined}
                      compact
                    />
                  </div>
                  {selected.place_name && (
                    <p className="mt-3 text-sm text-muted-foreground">{selected.place_name}</p>
                  )}
                </section>
              </div>

              <section className="mt-5 rounded-2xl border border-border bg-muted p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-green-700">Post details</p>
                <dl className="mt-3 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
                  <div><dt className="text-xs font-medium text-muted-foreground">Coordinates</dt><dd className="mt-1 font-mono text-xs">{selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}</dd></div>
                  <div><dt className="text-xs font-medium text-muted-foreground">Submitted</dt><dd className="mt-1">{new Date(selected.created_at).toLocaleString()}</dd></div>
                  <div><dt className="text-xs font-medium text-muted-foreground">Attachments</dt><dd className="mt-1">{[selected.image_path && "Photo", selected.music && "Song"].filter(Boolean).join(" + ") || "None"}</dd></div>
                  <div><dt className="text-xs font-medium text-muted-foreground">Reports</dt><dd className="mt-1">{reportCounts[selected.id] ?? 0}</dd></div>
                </dl>
              </section>

              <label className="mt-5 block text-sm font-medium">
                Moderation reason{" "}
                <span className="font-normal text-muted-foreground">Optional note shown only in admin history.</span>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} className={`mt-2 ${textareaClass}`} />
              </label>
            </div>

            {selected.status === "archived" && (
              <footer className="flex justify-end border-t border-border bg-surface p-4 sm:px-6">
                <button onClick={() => void restoreSelected()} className={primaryButtonClass}>
                  <RotateCcw className="size-4" />
                  {selected.deleted_at ? "Restore to archived" : "Restore and approve"}
                </button>
              </footer>
            )}
            {selected.status === "pending" && (
              <footer className="grid gap-2 border-t border-border bg-surface p-4 sm:grid-cols-2 sm:px-6">
                <button onClick={() => void decide(selected, "rejected")} className={`${secondaryButtonClass} border-danger text-danger hover:bg-danger-surface`}>
                  <XCircle className="size-4" />Reject
                </button>
                <button onClick={() => void decide(selected, "approved")} className={primaryButtonClass}>
                  <Check className="size-4" />Approve
                </button>
              </footer>
            )}
            {(selected.status === "approved" || selected.status === "flagged") && (
              <footer className="flex justify-end border-t border-border bg-surface p-4 sm:px-6">
                <button onClick={() => setArchiveConfirm(true)} className={`${secondaryButtonClass} border-danger text-danger hover:bg-danger-surface`}>
                  <Archive className="size-4" />Archive post
                </button>
              </footer>
            )}

            {archiveConfirm && (
              <div className="absolute inset-0 z-10 grid place-items-center bg-black/50 p-4" onClick={() => setArchiveConfirm(false)}>
                <section role="alertdialog" aria-modal="true" aria-labelledby="archive-title" className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                  <h3 id="archive-title" className="text-lg font-semibold">Archive this post?</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">Post leaves the public map. Soft delete keeps it archived with deleted metadata.</p>
                  <div className="mt-5 flex flex-wrap justify-end gap-2">
                    <button onClick={() => setArchiveConfirm(false)} className={secondaryButtonClass}>Cancel</button>
                    <button onClick={() => void softDeleteSelected()} className={`${secondaryButtonClass} border-danger text-danger hover:bg-danger-surface`}>Soft delete</button>
                    <button onClick={() => void archiveSelected()} className={dangerButtonClass}>Archive post</button>
                  </div>
                </section>
              </div>
            )}
          </article>
        </AdminModal>
      )}
      </div>{/* end desktop wrapper */}

      {/* ═══ MOBILE layout (<md) — full-screen map + bottom sheet ═══ */}
      <div className="relative -mx-3 -mt-3 h-[calc(100dvh-4rem)] overflow-hidden md:hidden">
        {/* Full-bleed map */}
        <div className="absolute inset-0">
          <AdminLocationMap
            posts={visible}
            selectedId={selectedId}
            reportCounts={reportCounts}
            onSelect={(id) => {
              const post = visible.find((p) => p.id === id);
              if (post) selectPost(post);
            }}
          />
        </div>

        {/* Floating search */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-2">
          <input
            aria-label="Search locations"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="pointer-events-auto h-10 w-full rounded-xl border border-border bg-surface/95 px-3 text-sm shadow-lg backdrop-blur-md outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </div>

        {/* Bottom sheet */}
        <div className={`absolute inset-x-0 bottom-0 z-10 flex flex-col rounded-t-2xl border-t border-border bg-surface shadow-2xl transition-[max-height] duration-300 ${selected ? "max-h-[55%]" : "max-h-[180px]"}`}>
          <div className="flex w-full shrink-0 flex-col items-center pt-2 pb-1">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
          </div>

          {selected ? (
            <>
              <div className="flex shrink-0 items-start justify-between gap-3 px-4 pb-2">
                <div className="min-w-0">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ring-1 ring-inset ${statusStyles[selected.status]}`}>{selected.status}</span>
                  <h2 className="mt-1 truncate text-base font-semibold">{selected.title}</h2>
                  {selected.place_name && <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />{selected.place_name}</p>}
                </div>
                <button aria-label="Close" onClick={() => { setSelected(null); setSelectedId(null); }} className="grid size-8 shrink-0 place-items-center rounded-full border text-muted-foreground"><X className="size-3.5" /></button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3">
                <p className="text-sm leading-6">{selected.body}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                  <span className="font-mono">{selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}</span>
                  <span>{new Date(selected.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="shrink-0 border-t border-border p-3">
                {selected.status === "pending" && (
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => void decide(selected, "rejected")} className={`${secondaryButtonClass} border-danger text-danger hover:bg-danger-surface`}><XCircle className="size-4" />Reject</button>
                    <button onClick={() => void decide(selected, "approved")} className={primaryButtonClass}><Check className="size-4" />Approve</button>
                  </div>
                )}
                {selected.status === "archived" && <button onClick={() => void restoreSelected()} className={`w-full ${primaryButtonClass}`}><RotateCcw className="size-4" />Restore</button>}
                {(selected.status === "approved" || selected.status === "flagged") && (
                  <button onClick={() => setArchiveConfirm(true)} className={`w-full ${secondaryButtonClass} border-danger text-danger hover:bg-danger-surface`}><Archive className="size-4" />Archive</button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex shrink-0 items-center justify-between px-4 pb-2">
                <p className="text-sm font-semibold">{visible.length} posts · {uniqueLocations} locations</p>
              </div>
              <div className="flex shrink-0 items-center gap-2 px-4 pb-2">
                <select value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className="h-8 rounded-lg border border-border bg-surface-elevated px-2 text-xs font-semibold">
                  {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <button type="button" onClick={reset} className="h-8 rounded-lg border border-border bg-surface-elevated px-2.5 text-xs font-semibold">Reset</button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
                {!loading && !visible.length && <p className="py-4 text-center text-xs text-muted-foreground">No posts match filters.</p>}
                {!loading && visible.map((post) => (
                  <button key={post.id} type="button" onClick={() => selectPost(post)} className={`mb-1 w-full rounded-xl p-2.5 text-left transition ${selectedId === post.id ? "bg-accent" : "hover:bg-muted"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{post.title || "Untitled"}</p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ring-1 ring-inset ${statusStyles[post.status]}`}>{post.status}</span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{post.place_name || `${post.lat.toFixed(3)}, ${post.lng.toFixed(3)}`}</p>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
