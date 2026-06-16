"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, ChevronRight, Flag, MapPin, RotateCcw, Search, X } from "lucide-react";
import { fetchPosts, fetchReports } from "@/features/moderation/admin-queries";
import { MusicCard, PostVisual } from "@/features/moderation/PostVisual";
import type { PostRow, ReportRow } from "@/features/moderation/types";
import { AdminLocationMap } from "./AdminLocationMap";
import { useLocationLabels } from "./use-location-labels";
import { useAdminRealtime } from "@/features/realtime/use-admin-realtime";

type StatusFilter = PostRow["status"] | "all" | "reported";
type Sort = "newest" | "coordinates-asc" | "coordinates-desc" | "reports";

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "visible", label: "Visible" },
  { value: "reported", label: "Reported" },
  { value: "hidden", label: "Hidden" },
  { value: "rejected", label: "Rejected" },
];

const statusStyles: Record<PostRow["status"], string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  visible: "bg-green-50 text-green-800 ring-green-200",
  rejected: "bg-red-50 text-red-800 ring-red-200",
  hidden: "bg-slate-100 text-slate-700 ring-slate-200",
  flagged: "bg-red-50 text-red-800 ring-red-200",
};

export function LocationsWorkspace() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const locationLabel = useLocationLabels(posts);

  useEffect(() => {
    Promise.all([fetchPosts(), fetchReports()])
      .then(([postRows, reportRows]) => { setPosts(postRows); setReports(reportRows); })
      .catch(() => setError("Location data could not be loaded."))
      .finally(() => setLoading(false));
  }, []);
  useAdminRealtime(["posts", "post_reports"], () => {
    Promise.all([fetchPosts(), fetchReports()])
      .then(([postRows, reportRows]) => { setPosts(postRows); setReports(reportRows); })
      .catch(() => setError("Location data could not be refreshed."));
  });

  const reportCounts = useMemo(
    () => reports.reduce<Record<string, number>>((counts, report) => ({ ...counts, [report.post_id]: (counts[report.post_id] ?? 0) + 1 }), {}),
    [reports],
  );
  const filtered = useMemo(() => posts
    .filter((post) => {
      if (status === "reported" && !reportCounts[post.id]) return false;
      if (status !== "all" && status !== "reported" && post.status !== status) return false;
      return `${post.title} ${post.body} ${post.place_name ?? ""}`.toLowerCase().includes(query.toLowerCase());
    })
    .sort((a, b) => sort === "coordinates-asc"
      ? `${a.lat},${a.lng}`.localeCompare(`${b.lat},${b.lng}`)
      : sort === "coordinates-desc"
        ? `${b.lat},${b.lng}`.localeCompare(`${a.lat},${a.lng}`)
        : sort === "reports"
          ? (reportCounts[b.id] ?? 0) - (reportCounts[a.id] ?? 0)
          : b.created_at.localeCompare(a.created_at)),
  [posts, query, reportCounts, sort, status]);
  const selected = posts.find((post) => post.id === selectedId) ?? null;
  const clusteredLocations = new Set(filtered.map((post) => `${post.lat.toFixed(4)},${post.lng.toFixed(4)}`)).size;
  const filtersActive = Boolean(query || status !== "all" || sort !== "newest");

  return <section className="flex min-h-[calc(100dvh-4rem)] flex-col">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-green-700">Decision support</p><h1 className="mt-2 text-3xl font-semibold">Location review</h1><p className="mt-2 text-sm text-slate-600">Select a post to center its pin and inspect details.</p></div>
      <div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full border bg-white px-3 py-2 shadow-sm"><strong>{filtered.length}</strong> posts</span><span className="rounded-full border bg-white px-3 py-2 shadow-sm"><strong>{clusteredLocations}</strong> locations</span><span className="rounded-full border border-red-100 bg-red-50 px-3 py-2 text-red-700 shadow-sm"><strong>{filtered.filter((post) => reportCounts[post.id]).length}</strong> reported</span></div>
    </div>
    {error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
    <div className="mt-6 grid min-h-0 flex-1 gap-4 xl:grid-cols-[380px_1fr]">
      <aside className="flex max-h-[72dvh] min-h-[480px] flex-col overflow-hidden rounded-3xl border border-[#dce3d8] bg-[#fbfcf8] shadow-sm">
        <div className="space-y-4 border-b border-[#dce3d8] p-4">
          <label className="block"><span className="mb-2 block text-xs font-semibold text-slate-700">Find a post or place</span><span className="relative block"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, thought, or place" className="h-11 w-full rounded-xl border border-[#cfdacb] bg-white pl-10 pr-3 text-sm shadow-sm outline-none focus:border-[#7f9f76] focus:ring-2 focus:ring-[#8fb487]/25" /></span></label>
          <fieldset><legend className="mb-2 text-xs font-semibold text-foreground">Show posts</legend><div className="flex flex-wrap gap-2">{statusOptions.map((option) => <button key={option.value} type="button" onClick={() => setStatus(option.value)} aria-pressed={status === option.value} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${status === option.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface-elevated text-foreground hover:bg-muted"}`}>{option.label}{option.value === "reported" && <Flag className="ml-1 inline size-3" />}</button>)}</div></fieldset>
          <label className="block"><span className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700"><ArrowUpDown className="size-3.5" />Sort results</span><select value={sort} onChange={(event) => setSort(event.target.value as Sort)} className="h-11 w-full rounded-xl border border-[#cfdacb] bg-white px-3 text-sm shadow-sm outline-none focus:border-[#7f9f76] focus:ring-2 focus:ring-[#8fb487]/25"><option value="newest">Newest activity first</option><option value="reports">Most reported first</option><option value="coordinates-asc">Coordinates ascending</option><option value="coordinates-desc">Coordinates descending</option></select></label>
          {filtersActive && <button type="button" onClick={() => { setQuery(""); setStatus("all"); setSort("newest"); }} className="flex items-center gap-2 text-xs font-semibold text-green-800 hover:underline"><RotateCcw className="size-3.5" />Clear search and filters</button>}
        </div>
        <div className="flex items-center justify-between border-b border-[#dce3d8] px-4 py-3"><p className="text-xs font-semibold text-slate-700">{filtered.length} matching posts</p><p className="text-[11px] text-slate-500">Select to view pin</p></div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          {loading ? <p className="p-5 text-sm text-slate-600">Loading locations...</p> : filtered.length ? filtered.map((post) => {
            const reportsForPost = reportCounts[post.id] ?? 0;
            return <button key={post.id} onClick={() => setSelectedId(post.id)} className={`group w-full rounded-2xl border p-3 text-left shadow-sm transition ${selectedId === post.id ? "border-[#6e9665] bg-[#eaf2e6] ring-2 ring-[#8fb487]/25" : "border-[#dce3d8] bg-white hover:border-[#9bb594] hover:bg-[#f7faf5]"}`}>
              <div className="flex items-start gap-3"><span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ${reportsForPost ? "bg-red-50 text-red-700" : "bg-[#e7eee3] text-[#245236]"}`}>{reportsForPost ? <Flag className="size-4" /> : <MapPin className="size-4" />}</span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="truncate font-semibold">{post.title}</p><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold capitalize ring-1 ring-inset ${statusStyles[post.status]}`}>{post.status}</span></div><p className="mt-1 truncate text-xs text-slate-600">{locationLabel(post)}</p>{reportsForPost > 0 && <p className="mt-2 text-xs font-semibold text-red-700">{reportsForPost} {reportsForPost === 1 ? "report needs" : "reports need"} review</p>}<p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-green-800 opacity-70 transition group-hover:opacity-100">View on map <ChevronRight className="size-3" /></p></div></div>
            </button>;
          }) : <div className="p-8 text-center"><Search className="mx-auto size-6 text-slate-400" /><p className="mt-3 text-sm font-semibold">No matching locations</p><p className="mt-1 text-xs text-slate-600">Try clearing filters or changing search.</p></div>}
        </div>
      </aside>
      <div className="relative min-h-[480px] overflow-hidden rounded-3xl border border-[#dce3d8] bg-white shadow-sm">
        <AdminLocationMap posts={filtered} selectedId={selectedId} reportCounts={reportCounts} onSelect={setSelectedId} />
        {!selected && <div className="pointer-events-none absolute left-3 top-3 rounded-xl border bg-white/95 px-3 py-2 text-xs font-medium text-slate-700 shadow-lg backdrop-blur">Select list item or map pin to inspect</div>}
        {selected && <article className="absolute inset-x-3 bottom-3 z-10 max-h-[60%] overflow-y-auto rounded-2xl border bg-white/95 p-4 shadow-2xl backdrop-blur md:inset-x-auto md:right-3 md:top-3 md:bottom-auto md:w-80 md:max-h-[calc(100%-1.5rem)]"><div className="flex justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-green-700">{selected.status}{reportCounts[selected.id] ? ` · ${reportCounts[selected.id]} report(s)` : ""}</p><h2 className="mt-1 font-semibold">{selected.title}</h2></div><button aria-label="Close details" onClick={() => setSelectedId(null)} className="grid size-8 place-items-center rounded-full border bg-white text-slate-600"><X className="size-3.5" /></button></div><div className="mt-3"><PostVisual post={selected} compact /></div><p className="mt-3 line-clamp-4 text-sm leading-6">{selected.body}</p><MusicCard post={selected} /><div className="mt-3 rounded-xl bg-slate-100 p-3 font-mono text-xs text-slate-700">{selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}</div></article>}
      </div>
    </div>
  </section>;
}
