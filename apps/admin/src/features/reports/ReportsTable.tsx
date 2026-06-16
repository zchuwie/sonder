"use client";

import { useEffect, useMemo, useState } from "react";
import { archivePost, fetchPosts, fetchReports, moderatePost, updateReportStatus } from "@/features/moderation/admin-queries";
import { MusicCard, PostVisual } from "@/features/moderation/PostVisual";
import type { PostRow, ReportRow } from "@/features/moderation/types";
import { useAdminRealtime } from "@/features/realtime/use-admin-realtime";
import { controlClass, isWithinDateRange, textareaClass, type DateRange } from "@/lib/admin-list-utils";

export function ReportsTable() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [selected, setSelected] = useState<ReportRow | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ReportRow["status"] | "all">("open");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [date, setDate] = useState<DateRange>("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "count" | "reason">("newest");

  const load = () => Promise.all([fetchReports(), fetchPosts()]).then(([reportRows, postRows]) => {
    setReports(reportRows);
    setPosts(postRows);
  });
  useEffect(() => { void load().catch(() => setError("Reports could not be loaded.")); }, []);
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

  async function hide() {
    if (!selected || !selectedPost) return;
    try {
      await moderatePost(selectedPost.id, "hidden", reason || `Report: ${selected.reason}`);
      await updateReportStatus(selected.id, "actioned");
      setSelected(null); setReason(""); await load();
    } catch { setError("Reported post could not be hidden."); }
  }

  async function archive() {
    if (!selected || !selectedPost) return;
    try {
      await archivePost(selectedPost.id, reason || `Archived after report: ${selected.reason}`);
      await updateReportStatus(selected.id, "actioned");
      setArchiveConfirm(false); setSelected(null); setReason(""); await load();
    } catch { setError("Reported post could not be archived."); }
  }

  return <section>
    <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-700">Safety</p>
    <h1 className="mt-2 text-3xl font-semibold">Reports</h1>
    <p className="mt-2 text-sm text-slate-600">{reports.length} reports received.</p>
    <div className="mt-5 grid gap-2 rounded-2xl border bg-[#fbfcf8] p-3 shadow-sm sm:grid-cols-2 xl:grid-cols-[1.5fr_repeat(4,1fr)_auto]">
      <input aria-label="Search reports" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search report or post..." className={controlClass} />
      <select aria-label="Status" value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className={controlClass}><option value="open">Open</option><option value="reviewed">Reviewed</option><option value="dismissed">Dismissed</option><option value="actioned">Actioned</option><option value="all">All statuses</option></select>
      <select aria-label="Reason" value={reasonFilter} onChange={(event) => setReasonFilter(event.target.value)} className={controlClass}><option value="all">All reasons</option>{reasons.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select>
      <select aria-label="Date" value={date} onChange={(event) => setDate(event.target.value as DateRange)} className={controlClass}><option value="all">All time</option><option value="today">Today</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></select>
      <select aria-label="Sort" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)} className={controlClass}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="count">Most reported</option><option value="reason">Reason A-Z</option></select>
      <button onClick={() => { setQuery(""); setStatus("open"); setReasonFilter("all"); setDate("all"); setSort("newest"); }} className="h-11 rounded-xl border bg-white px-4 text-sm font-semibold">Reset</button>
    </div>
    {error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
    <div className="mt-4 overflow-x-auto rounded-2xl border bg-white shadow-sm">
      <table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-[#f0f4ed] text-xs uppercase text-slate-600"><tr><th className="p-4">Reported post</th><th className="p-4">Reason</th><th className="p-4">Reports</th><th className="p-4">Status</th><th className="p-4">Reported</th></tr></thead><tbody>{visible.map((report) => { const post = posts.find((item) => item.id === report.post_id); return <tr key={report.id} onClick={() => setSelected(report)} className="cursor-pointer border-t hover:bg-green-50/50"><td className="p-4"><p className="font-semibold">{post?.title ?? "Post unavailable"}</p><p className="max-w-xs truncate text-slate-600">{post?.body}</p></td><td className="p-4 capitalize">{report.reason.replaceAll("_", " ")}</td><td className="p-4 font-semibold text-red-700">{counts[report.post_id] ?? 1}</td><td className="p-4 capitalize">{report.status}</td><td className="p-4 text-slate-600">{new Date(report.created_at).toLocaleString()}</td></tr>; })}</tbody></table>
      {!visible.length && <p className="p-10 text-center text-sm text-slate-600">No reports match filters.</p>}
    </div>
    {selected && <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 p-3 sm:place-items-center" onClick={() => setSelected(null)}>
      <article className="relative flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-surface shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <header className="flex justify-between border-b p-5"><div><p className="text-xs uppercase text-red-700">{counts[selected.post_id] ?? 1} report(s) · {selected.status}</p><h2 className="mt-2 text-2xl font-semibold capitalize">{selected.reason.replaceAll("_", " ")}</h2></div><button onClick={() => setSelected(null)}>Close</button></header>
        <div className="overflow-y-auto p-5"><p className="rounded-xl bg-red-50 p-3 text-sm text-red-900">{selected.details ?? "No additional details."}</p>{selectedPost && <><div className="mt-5"><PostVisual post={selectedPost} /></div><h3 className="mt-5 text-xl font-semibold">{selectedPost.title}</h3><p className="mt-2 leading-7">{selectedPost.body}</p><MusicCard post={selectedPost} /><label className="mt-5 block text-sm font-medium">Moderation reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} className={`mt-2 ${textareaClass}`} /></label></>}</div>
        {selectedPost && <footer className="flex flex-wrap justify-end gap-2 border-t bg-surface p-4"><button onClick={() => setArchiveConfirm(true)} disabled={Boolean(selectedPost.archived_at)} className="rounded-xl border border-danger bg-surface-elevated px-5 py-2.5 font-semibold text-danger hover:bg-danger-surface disabled:opacity-50">{selectedPost.archived_at ? "Post archived" : "Archive post"}</button><button onClick={() => void hide()} disabled={selectedPost.status === "hidden"} className="rounded-xl bg-danger px-5 py-2.5 font-semibold text-danger-foreground hover:bg-danger-hover disabled:opacity-50">{selectedPost.status === "hidden" ? "Post already hidden" : "Hide reported post"}</button></footer>}
        {archiveConfirm && <div className="absolute inset-0 z-10 grid place-items-center bg-black/50 p-4" onClick={() => setArchiveConfirm(false)}><section role="alertdialog" aria-modal="true" aria-labelledby="report-archive-title" className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}><h3 id="report-archive-title" className="text-lg font-semibold">Archive reported post?</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Post becomes hidden and remains recoverable from Archived posts.</p><div className="mt-5 flex justify-end gap-2"><button onClick={() => setArchiveConfirm(false)} className="rounded-xl border border-border bg-surface-elevated px-4 py-2 font-semibold">Cancel</button><button onClick={() => void archive()} className="rounded-xl bg-danger px-4 py-2 font-semibold text-danger-foreground hover:bg-danger-hover">Archive post</button></div></section></div>}
      </article>
    </div>}
  </section>;
}
