"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Archive, Check, CircleDashed, MapPin, RotateCcw, Sparkles, X, XCircle } from "lucide-react";
import { AdminLocationMap } from "@/features/locations/AdminLocationMap";
import { useLocationLabels } from "@/features/locations/use-location-labels";
import { useAdminRealtime } from "@/features/realtime/use-admin-realtime";
import { controlClass, isWithinDateRange, textareaClass, type DateRange } from "@/lib/admin-list-utils";
import { archivePost, fetchPosts, moderatePost, restoreArchivedPost } from "./admin-queries";
import { MusicCard, PostVisual } from "./PostVisual";
import type { PostRow } from "./types";

type Decision = "visible" | "rejected";
type ContentFilter = "all" | "text" | "photo" | "music" | "both";
type Sort = "newest" | "oldest" | "coordinates-asc" | "coordinates-desc" | "status";
type StatusFilter = PostRow["status"] | "all" | "archived";
const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "visible", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "hidden", label: "Hidden" },
  { value: "archived", label: "Archived" },
  { value: "flagged", label: "Flagged" },
  { value: "all", label: "All posts" },
];
const statusStyles: Record<PostRow["status"], string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  visible: "bg-green-50 text-green-800 ring-green-200",
  rejected: "bg-red-50 text-red-800 ring-red-200",
  hidden: "bg-slate-100 text-slate-700 ring-slate-200",
  flagged: "bg-red-50 text-red-800 ring-red-200",
};

export function ModerationTable() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [content, setContent] = useState<ContentFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PostRow | null>(null);
  const [reason, setReason] = useState("");
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [error, setError] = useState("");
  const locationLabel = useLocationLabels(posts);
  const searchParams = useSearchParams();
  const load = () => fetchPosts().then(setPosts).catch(() => setError("Posts could not be loaded."));

  useEffect(() => { void load(); }, []);
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
      if (status === "archived") return Boolean(post.archived_at);
      if (status === "hidden") return post.status === "hidden" && !post.archived_at;
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

  async function restoreSelected() {
    if (!selected) return;
    try {
      await restoreArchivedPost(selected.id);
      setSelected(null); setReason(""); await load();
    } catch { setError("Post could not be restored."); }
  }

  return (
    <section>
      <div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-green-700">Posts</p><h1 className="mt-1 text-2xl font-semibold">Moderation</h1><p className="mt-1 text-xs text-slate-600">Review posts and confirm smart suggestions before making a decision.</p></div>
      <div className="mt-4 rounded-2xl border border-[#dce3d8] bg-[#fbfcf8] p-3 shadow-sm">
        <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Filter posts by status">
          {statusOptions.map((option) => {
            const count = option.value === "all"
              ? posts.length
              : option.value === "archived"
                ? posts.filter((post) => post.archived_at).length
                : option.value === "hidden"
                  ? posts.filter((post) => post.status === "hidden" && !post.archived_at).length
                  : posts.filter((post) => post.status === option.value).length;
            return <button key={option.value} type="button" aria-pressed={status === option.value} onClick={() => setStatus(option.value)} className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${status === option.value ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-surface-elevated text-foreground hover:bg-muted"}`}><span>{option.label}</span><span className={`rounded-full px-1.5 py-0.5 text-[10px] ${status === option.value ? "bg-primary-foreground/15 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{count}</span></button>;
          })}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[1.5fr_repeat(3,1fr)_auto]">
        <input aria-label="Search posts" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search post or place..." className={controlClass} />
        <select aria-label="Content type" value={content} onChange={(event) => setContent(event.target.value as ContentFilter)} className={controlClass}><option value="all">All content</option><option value="text">Text only</option><option value="photo">Photo only</option><option value="music">Music only</option><option value="both">Photo + music</option></select>
        <select aria-label="Date range" value={dateRange} onChange={(event) => setDateRange(event.target.value as DateRange)} className={controlClass}><option value="all">All time</option><option value="today">Today</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></select>
        <select aria-label="Sort posts" value={sort} onChange={(event) => setSort(event.target.value as Sort)} className={controlClass}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="coordinates-asc">Coordinates ascending</option><option value="coordinates-desc">Coordinates descending</option><option value="status">Status</option></select>
        <button onClick={() => { setQuery(""); setStatus("pending"); setContent("all"); setDateRange("all"); setSort("newest"); }} className="h-11 rounded-xl border border-[#cfdacb] bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-[#eff3eb]">Reset</button>
        </div>
      </div>
      {error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-[#dce3d8] bg-white shadow-sm">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm"><thead className="bg-[#f0f4ed] text-xs uppercase tracking-wide text-slate-600"><tr><th className="p-4">Post</th><th className="p-4">Location</th><th className="p-4">Media</th><th className="p-4">Status</th><th className="p-4">Created</th></tr></thead><tbody>
          {visible.map((post) => <tr key={post.id} className="cursor-pointer border-t hover:bg-green-50/50" onClick={() => setSelected(post)}><td className="p-4"><p className="font-semibold">{post.title}</p><p className="mt-1 max-w-md truncate text-slate-600">{post.body}</p></td><td className="p-4 font-mono text-xs">{locationLabel(post)}</td><td className="p-4">{[post.image_path && "Photo", post.music && "Song"].filter(Boolean).join(" + ") || "Text"}</td><td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${statusStyles[post.status]}`}>{post.archived_at ? "archived" : post.status === "visible" ? "approved" : post.status}</span></td><td className="p-4 text-slate-600">{new Date(post.created_at).toLocaleString()}</td></tr>)}
        </tbody></table>
        {!visible.length && <p className="p-10 text-center text-sm text-slate-600">No posts match these filters.</p>}
      </div>
      {selected && <div className="fixed inset-0 z-50 grid place-items-end bg-black/40 p-3 sm:place-items-center" onClick={() => setSelected(null)}>
        <article className="relative flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-surface shadow-2xl" onClick={(event) => event.stopPropagation()}>
          <header className="flex justify-between gap-4 border-b border-[#dce3d8] p-4 sm:p-6"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">{selected.archived_at ? "archived" : selected.status} post</p><h2 className="mt-2 text-2xl font-semibold">{selected.title}</h2></div><button aria-label="Close post detail" onClick={() => setSelected(null)} className="grid size-10 place-items-center rounded-full border bg-white text-slate-600"><X className="size-4" /></button></header>
          <div className="min-h-0 overflow-y-auto p-4 sm:p-6">
            <section className="mb-4 flex items-start gap-3 rounded-2xl border border-[#d8e2d4] bg-[#f1f6ee] p-4">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-green-800 shadow-sm"><Sparkles className="size-4" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold">Smart review suggestion</h3><span className="flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 ring-1 ring-inset ring-[#d4ddd0]"><CircleDashed className="size-3" />Not analyzed</span></div>
                <p className="mt-1 text-xs leading-5 text-slate-600">Suggestion service is not connected yet. Admin decision remains manual. Future analysis can plug into this panel without changing review actions.</p>
              </div>
            </section>
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
            <label className="mt-5 block text-sm font-medium">Moderation reason <span className="font-normal text-slate-600">(recommended for rejection)</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} className={`mt-2 ${textareaClass}`} /></label>
          </div>
          {selected.archived_at
            ? <footer className="flex justify-end border-t border-border bg-surface p-4 sm:px-6"><button onClick={() => void restoreSelected()} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-semibold text-primary-foreground hover:bg-primary-hover"><RotateCcw className="size-4" />Restore to pending review</button></footer>
            : <footer className="grid gap-2 border-t border-border bg-surface p-4 backdrop-blur sm:grid-cols-[auto_1fr_1fr] sm:px-6"><button onClick={() => setArchiveConfirm(true)} className="flex items-center justify-center gap-2 rounded-xl border border-danger bg-surface-elevated px-3 py-2.5 font-semibold text-danger hover:bg-danger-surface"><Archive className="size-4" />Archive post</button><button onClick={() => void decide(selected, "rejected")} className="flex items-center justify-center gap-2 rounded-xl border border-danger bg-surface-elevated px-3 py-2.5 font-semibold text-danger hover:bg-danger-surface"><XCircle className="size-4" />Reject and hide</button><button onClick={() => void decide(selected, "visible")} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2.5 font-semibold text-primary-foreground hover:bg-primary-hover"><Check className="size-4" />Approve and publish</button></footer>}
          {archiveConfirm && <div className="absolute inset-0 z-10 grid place-items-center bg-black/50 p-4" onClick={() => setArchiveConfirm(false)}><section role="alertdialog" aria-modal="true" aria-labelledby="archive-title" className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}><h3 id="archive-title" className="text-lg font-semibold">Archive this post?</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Post becomes hidden and moves to Archived. Media, reports, and audit history stay intact. You can restore it later.</p><div className="mt-5 flex justify-end gap-2"><button onClick={() => setArchiveConfirm(false)} className="rounded-xl border border-border bg-surface-elevated px-4 py-2 font-semibold text-foreground hover:bg-muted">Cancel</button><button onClick={() => void archiveSelected()} className="rounded-xl bg-danger px-4 py-2 font-semibold text-danger-foreground hover:bg-danger-hover">Archive post</button></div></section></div>}
        </article>
      </div>}
    </section>
  );
}
