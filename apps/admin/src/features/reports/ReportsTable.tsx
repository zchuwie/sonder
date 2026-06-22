"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Filter, SlidersHorizontal } from "lucide-react";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { AdminModal } from "@/components/ui/admin-modal";
import { archivePost, dismissReport, fetchPosts, fetchReportsPage, updateReportStatus } from "@/features/moderation/admin-queries";
import { MusicCard, PostVisual } from "@/features/moderation/PostVisual";
import type { PostRow, ReportRow } from "@/features/moderation/types";
import { useAdminRealtime } from "@/features/realtime/use-admin-realtime";
import { controlClass, dangerButtonClass, isWithinDateRange, panelClass, secondaryButtonClass, textareaClass, toolButtonClass, type DateRange } from "@/lib/admin-list-utils";

export function ReportsTable() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [selected, setSelected] = useState<ReportRow | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [dismissConfirm, setDismissConfirm] = useState(false);
  const [reviewConfirm, setReviewConfirm] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<ReportRow["status"] | "all">("open");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [date, setDate] = useState<DateRange>("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "count" | "reason">("newest");
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const pageSize = 25;
  const load = useCallback(() => Promise.all([fetchReportsPage({ page, pageSize, status, query, reason: reasonFilter, dateRange: date, sort }), fetchPosts()]).then(([reportResult, postRows]) => {
    setReports(reportResult.rows);
    setTotal(reportResult.count);
    setPosts(postRows);
  }), [date, page, query, reasonFilter, sort, status]);
  useEffect(() => { void load().catch(() => setError("Reports could not be loaded.")); }, [load]);
  useAdminRealtime(["posts", "post_reports"], load);

  const counts = useMemo(() => reports.reduce<Record<string, number>>(
    (all, report) => ({ ...all, [report.post_id]: (all[report.post_id] ?? 0) + 1 }),
    {},
  ), [reports]);
  const reasons = useMemo(() => [...new Set(reports.map((report) => report.reason))].sort(), [reports]);
  const visible = useMemo(() => reports
    .filter((report) => status === "all" || report.status === status)
    .filter((report) => reasonFilter === "all" || report.reason === reasonFilter)
    .filter((report) => isWithinDateRange(report.created_at, date))
    .filter((report) => {
      const post = posts.find((item) => item.id === report.post_id);
      return `${report.reason} ${report.details} ${post?.title} ${post?.body} ${post?.place_name}`.toLowerCase().includes(query.toLowerCase());
    })
    .sort((a, b) => sort === "oldest"
      ? a.created_at.localeCompare(b.created_at)
      : sort === "count"
        ? (counts[b.post_id] ?? 0) - (counts[a.post_id] ?? 0)
        : sort === "reason"
          ? a.reason.localeCompare(b.reason)
          : b.created_at.localeCompare(a.created_at)),
  [counts, date, posts, query, reasonFilter, reports, sort, status]);
  const selectedPost = selected ? posts.find((post) => post.id === selected.post_id) ?? null : null;

  async function archive() {
    if (!selected || !selectedPost) return;
    try {
      await archivePost(selectedPost.id, reason || `Archived after report: ${selected.reason}`);
      await updateReportStatus(selected.id, "actioned");
      setArchiveConfirm(false); setSelected(null); setReason(""); await load();
    } catch { setError("Reported post could not be archived."); }
  }

  async function dismiss() {
    if (!selected || !selectedPost) return;
    try {
      await dismissReport(selected.id, selectedPost.id);
    } catch (err) {
      console.error("Dismiss failed:", err);
      setError("Report could not be dismissed.");
      return;
    }
    setDismissConfirm(false); setSelected(null); setReason("");
    void load();
  }

  async function markReviewing() {
    if (!selected) return;
    try {
      await updateReportStatus(selected.id, "reviewing");
    } catch { setError("Could not update report."); return; }
    setReviewConfirm(false); setSelected(null); setReason("");
    void load();
  }

  return <section>
    <div className="rounded-2xl border border-border bg-surface p-3 shadow-sm md:p-4">
      <div className="hidden flex-wrap items-end justify-between gap-3 md:flex">
        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-green-700">Safety</p><h1 className="mt-2 text-2xl font-semibold md:text-3xl">Reports</h1><p className="mt-2 text-sm text-slate-600">{reports.length} reports received.</p></div>
        <p className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">{total} results</p>
      </div>
    <div className="flex items-center gap-2 md:mt-4 md:grid md:grid-cols-[1fr_180px_auto_auto_auto]">
      <input aria-label="Search reports" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search..." className={`min-w-0 flex-1 ${controlClass}`} />
      <select aria-label="Status" value={status} onChange={(event) => { setStatus(event.target.value as typeof status); setPage(1); }} className={`hidden md:block ${controlClass}`}><option value="open">Open</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option><option value="actioned">Actioned</option><option value="all">All statuses</option></select>
      <div className="relative">
        <button type="button" onClick={() => { setFilterOpen((open) => !open); setSortOpen(false); }} className="grid size-10 place-items-center rounded-xl border border-border shadow-sm md:flex md:h-11 md:w-auto md:items-center md:gap-2 md:px-3 md:text-sm md:font-semibold"><Filter className="size-4" /><span className="hidden md:inline">Filter</span></button>
        {filterOpen && <div className={panelClass}>
          <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground md:hidden">Status<select aria-label="Status" value={status} onChange={(event) => { setStatus(event.target.value as typeof status); setPage(1); }} className={`mt-2 w-full ${controlClass}`}><option value="open">Open</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option><option value="actioned">Actioned</option><option value="all">All</option></select></label>
          <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-muted-foreground md:mt-0">Reason<select aria-label="Reason" value={reasonFilter} onChange={(event) => { setReasonFilter(event.target.value); setPage(1); }} className={`mt-2 w-full ${controlClass}`}><option value="all">All reasons</option>{reasons.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label>
          <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-muted-foreground">Date<select aria-label="Date" value={date} onChange={(event) => { setDate(event.target.value as DateRange); setPage(1); }} className={`mt-2 w-full ${controlClass}`}><option value="all">All time</option><option value="today">Today</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></select></label>
        </div>}
      </div>
      <div className="relative">
        <button type="button" onClick={() => { setSortOpen((open) => !open); setFilterOpen(false); }} className="grid size-10 place-items-center rounded-xl border border-border shadow-sm md:flex md:h-11 md:w-auto md:items-center md:gap-2 md:px-3 md:text-sm md:font-semibold"><SlidersHorizontal className="size-4" /><span className="hidden md:inline">Sort</span></button>
        {sortOpen && <div className={panelClass}>
          <select aria-label="Sort" value={sort} onChange={(event) => { setSort(event.target.value as typeof sort); setPage(1); }} className={`w-full ${controlClass}`}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="count">Most reported</option><option value="reason">Reason A-Z</option></select>
        </div>}
      </div>
      <button onClick={() => { setQuery(""); setStatus("open"); setReasonFilter("all"); setDate("all"); setSort("newest"); setPage(1); }} className={`hidden md:block ${toolButtonClass}`}>Reset</button>
    </div>
    </div>
    {error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}

    {/* Mobile card list */}
    <div className="mt-4 space-y-2 md:hidden">
      {visible.map((report) => {
        const post = posts.find((item) => item.id === report.post_id);
        return (
          <button key={report.id} type="button" onClick={() => setSelected(report)} className="w-full rounded-2xl border border-border bg-surface p-3 text-left shadow-sm transition hover:bg-muted">
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-sm font-semibold capitalize">{report.reason.replaceAll("_", " ")}</p>
              <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold capitalize text-accent-foreground">{report.status}</span>
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">{post?.title ?? "Post unavailable"}</p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-red-700">{counts[report.post_id] ?? 1} report{(counts[report.post_id] ?? 1) !== 1 ? "s" : ""}</span>
              <span className="text-[10px] text-muted-foreground">{new Date(report.created_at).toLocaleDateString()}</span>
            </div>
          </button>
        );
      })}
      {!visible.length && <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No reports match filters.</p>}
    </div>

    {/* Desktop table */}
    <div className="mt-4 hidden overflow-x-auto rounded-2xl border bg-white shadow-sm md:block">
      <table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-[#f0f4ed] text-xs uppercase text-slate-600"><tr><th className="p-4">Reported post</th><th className="p-4">Reason</th><th className="p-4">Reports</th><th className="p-4">Status</th><th className="p-4">Reported</th></tr></thead><tbody>{visible.map((report) => { const post = posts.find((item) => item.id === report.post_id); return <tr key={report.id} onClick={() => setSelected(report)} className="cursor-pointer border-t hover:bg-green-50/50"><td className="p-4"><p className="font-semibold">{post?.title ?? "Post unavailable"}</p><p className="max-w-xs truncate text-slate-600">{post?.body}</p></td><td className="p-4 capitalize">{report.reason.replaceAll("_", " ")}</td><td className="p-4 font-semibold text-red-700">{counts[report.post_id] ?? 1}</td><td className="p-4 capitalize">{report.status}</td><td className="p-4 text-slate-600">{new Date(report.created_at).toLocaleString()}</td></tr>; })}</tbody></table>
      {!visible.length && <p className="p-10 text-center text-sm text-slate-600">No reports match filters.</p>}
    </div>
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
      <span>Page {page} of {Math.max(1, Math.ceil(total / pageSize))}</span>
      <div className="flex gap-2"><button type="button" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className={toolButtonClass}>Previous</button><button type="button" disabled={page >= Math.ceil(total / pageSize)} onClick={() => setPage((value) => value + 1)} className={toolButtonClass}>Next</button></div>
    </div>
    {selected && <AdminModal onClose={() => setSelected(null)}>
      <article role="dialog" aria-modal="true" aria-labelledby="report-detail-title" className="relative flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-surface shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <header className="flex justify-between border-b p-5">
          <div>
            <p className="text-xs uppercase text-red-700">{counts[selected.post_id] ?? 1} report(s) · {selected.status}</p>
            <h2 id="report-detail-title" className="mt-2 text-2xl font-semibold">Report details</h2>
          </div>
          <button onClick={() => setSelected(null)} className="text-sm font-semibold text-muted-foreground">Close</button>
        </header>
        <div className="overflow-y-auto p-5">
          {/* Reason breakdown table */}
          <section className="rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-2 text-left">Reason</th><th className="px-4 py-2 text-right">Count</th></tr></thead>
              <tbody>
                {(() => {
                  const reasonCounts = new Map<string, number>();
                  reports.filter((r) => r.post_id === selected.post_id).forEach((r) => {
                    reasonCounts.set(r.reason, (reasonCounts.get(r.reason) ?? 0) + 1);
                  });
                  return [...reasonCounts.entries()].sort((a, b) => b[1] - a[1]).map(([r, c]) => (
                    <tr key={r} className="border-t"><td className="px-4 py-2 capitalize">{r.replaceAll("_", " ")}</td><td className="px-4 py-2 text-right font-semibold text-red-700">{c}</td></tr>
                  ));
                })()}
              </tbody>
            </table>
          </section>

          {/* Post content */}
          {selectedPost && (
            <div className="mt-5">
              {selectedPost.image_path && <div className="mb-4"><PostVisual post={selectedPost} /></div>}
              <h3 className="text-xl font-semibold">{selectedPost.title}</h3>
              <p className="mt-2 leading-7 text-foreground">{selectedPost.body}</p>
              <MusicCard post={selectedPost} />
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="font-mono">{selectedPost.lat.toFixed(4)}, {selectedPost.lng.toFixed(4)}</span>
                {selectedPost.place_name && <span>{selectedPost.place_name}</span>}
                <span>{new Date(selectedPost.created_at).toLocaleString()}</span>
              </div>
              <label className="mt-5 block text-sm font-medium">Moderation reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} className={`mt-2 ${textareaClass}`} /></label>
            </div>
          )}
        </div>
        {selectedPost && <footer className="flex flex-wrap justify-end gap-2 border-t bg-surface p-4">
          <button onClick={() => setReviewConfirm(true)} disabled={selected.status !== "open"} className={secondaryButtonClass}>Mark reviewing</button>
          <button onClick={() => setDismissConfirm(true)} className={secondaryButtonClass}>Dismiss report</button>
          <button onClick={() => setArchiveConfirm(true)} disabled={selectedPost.status === "archived"} className={dangerButtonClass}>{selectedPost.status === "archived" ? "Post archived" : "Archive post"}</button>
        </footer>}
        <ConfirmModal open={reviewConfirm} title="Mark as reviewing?" description="This report will be marked as under review." confirmLabel="Mark reviewing" variant="primary" onConfirm={() => void markReviewing()} onCancel={() => setReviewConfirm(false)} />
        <ConfirmModal open={dismissConfirm} title="Dismiss this report?" description="The report will be dismissed. If the post was flagged, it will be restored to approved." confirmLabel="Dismiss" variant="primary" onConfirm={() => void dismiss()} onCancel={() => setDismissConfirm(false)} />
        {archiveConfirm && <div className="absolute inset-0 z-10 grid place-items-center bg-black/50 p-4" onClick={() => setArchiveConfirm(false)}><section role="alertdialog" aria-modal="true" aria-labelledby="report-archive-title" className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}><h3 id="report-archive-title" className="text-lg font-semibold">Archive reported post?</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Post leaves the public map and remains recoverable from Archived posts.</p><div className="mt-5 flex justify-end gap-2"><button onClick={() => setArchiveConfirm(false)} className={secondaryButtonClass}>Cancel</button><button onClick={() => void archive()} className={dangerButtonClass}>Archive post</button></div></section></div>}
      </article>
    </AdminModal>}
  </section>;
}
