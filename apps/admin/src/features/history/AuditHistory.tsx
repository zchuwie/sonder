"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Filter, SlidersHorizontal, X } from "lucide-react";
import { AdminModal } from "@/components/ui/admin-modal";
import { AuditEventCard, getAuditMeta, relativeTime, statusLabel } from "@/features/history/audit-event-ui";
import { fetchAuditHistoryPage } from "@/features/moderation/admin-queries";
import type { AuditRow, PostRow } from "@/features/moderation/types";
import { useAdminRealtime } from "@/features/realtime/use-admin-realtime";
import { controlClass, panelClass, secondaryButtonClass, toolButtonClass, type DateRange } from "@/lib/admin-list-utils";

const actionOptions = [
  ["all", "All actions"],
  ["submitted", "Submitted for review"],
  ["approved", "Approved and published"],
  ["rejected", "Rejected"],
  ["flagged", "Flagged"],
  ["archived", "Archived"],
  ["deleted", "Soft deleted"],
  ["restored", "Restored"],
  ["report_dismissed", "Report dismissed"],
  ["report_resolved", "Report resolved"],
] as const;

export function AuditHistory() {
  const [events, setEvents] = useState<AuditRow[]>([]);
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [selected, setSelected] = useState<AuditRow | null>(null);
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("all");
  const [date, setDate] = useState<DateRange>("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "action">("newest");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const pageSize = 25;

  const load = useCallback(() => {
    setLoading(true);
    return fetchAuditHistoryPage({ page, pageSize, action, query, dateRange: date, sort })
      .then((result) => {
        setEvents(result.rows);
        setPosts(result.posts);
        setTotal(result.count);
        setError("");
      })
      .catch(() => setError("Audit history could not be loaded."))
      .finally(() => setLoading(false));
  }, [action, date, page, query, sort]);

  useEffect(() => { void load(); }, [load]);
  useAdminRealtime(["moderation_events"], load);

  const postMap = useMemo(() => new Map(posts.map((post) => [post.id, post])), [posts]);
  const selectedPost = selected?.post_id ? postMap.get(selected.post_id) : undefined;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function reset() {
    setQuery("");
    setAction("all");
    setDate("all");
    setSort("newest");
    setPage(1);
  }

  return (
    <section className="admin-soft-in">
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-700">Accountability</p>
            <h1 className="mt-2 text-2xl font-semibold md:text-3xl">Audit history</h1>
            <p className="mt-2 text-sm text-muted-foreground">Readable timeline of moderation changes.</p>
          </div>
          <p className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">{total} events</p>
        </div>
        <div className="mt-4 grid gap-2 lg:grid-cols-[1fr_220px_auto_auto_auto]">
          <input aria-label="Search audit history" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search audit history..." className={controlClass} />
          <select aria-label="Action" value={action} onChange={(event) => { setAction(event.target.value); setPage(1); }} className={controlClass}>{actionOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <div className="relative">
            <button type="button" onClick={() => { setFilterOpen((open) => !open); setSortOpen(false); }} className={`flex w-full items-center justify-center gap-2 ${toolButtonClass}`}><Filter className="size-4" />Filter</button>
            {filterOpen && <div className={panelClass}>
              <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">Date<select aria-label="Date" value={date} onChange={(event) => { setDate(event.target.value as DateRange); setPage(1); }} className={`mt-2 w-full ${controlClass}`}><option value="all">All time</option><option value="today">Today</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></select></label>
            </div>}
          </div>
          <div className="relative">
            <button type="button" onClick={() => { setSortOpen((open) => !open); setFilterOpen(false); }} className={`flex w-full items-center justify-center gap-2 ${toolButtonClass}`}><SlidersHorizontal className="size-4" />Sort</button>
            {sortOpen && <div className={panelClass}>
              <select aria-label="Sort" value={sort} onChange={(event) => { setSort(event.target.value as typeof sort); setPage(1); }} className={`w-full ${controlClass}`}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="action">Action type</option></select>
            </div>}
          </div>
          <button type="button" onClick={reset} className={toolButtonClass}>Reset</button>
        </div>
      </div>

      {error && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-danger/20 bg-danger-surface p-4 text-danger"><p>{error}</p><button type="button" onClick={() => void load()} className={secondaryButtonClass}>Retry</button></div>}

      <div className="mt-4 space-y-3">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl border border-border bg-surface" />)
          : events.map((event) => <AuditEventCard key={event.id} event={event} post={event.post_id ? postMap.get(event.post_id) : undefined} onOpen={() => setSelected(event)} />)}
        {!loading && !events.length && <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center"><p className="font-semibold">No audit events found.</p><p className="mt-1 text-sm text-muted-foreground">Try changing your search or filters.</p></div>}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>Page {page} of {totalPages}</span>
        <div className="flex gap-2"><button type="button" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className={toolButtonClass}>Previous</button><button type="button" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)} className={toolButtonClass}>Next</button></div>
      </div>

      {selected && <AdminModal onClose={() => setSelected(null)}>
        <article role="dialog" aria-modal="true" aria-labelledby="audit-detail-title" className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-surface shadow-2xl" onClick={(event) => event.stopPropagation()}>
          <header className="flex items-start justify-between gap-4 border-b border-border p-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-700">Audit event</p>
              <h2 id="audit-detail-title" className="mt-2 text-2xl font-semibold">{getAuditMeta(selected.action).label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{relativeTime(selected.created_at)} - {new Date(selected.created_at).toLocaleString()}</p>
            </div>
            <button type="button" aria-label="Close audit details" onClick={() => setSelected(null)} className="grid size-10 place-items-center rounded-full border border-border bg-surface-elevated text-muted-foreground"><X className="size-4" /></button>
          </header>
          <div className="min-h-0 space-y-4 overflow-y-auto p-5">
            <section className="rounded-2xl border border-border bg-surface-elevated p-4">
              <h3 className="font-semibold">Decision summary</h3>
              <p className="mt-2 text-sm text-muted-foreground">{selected.reason || "No moderation reason recorded."}</p>
              <p className="mt-3 text-xs text-muted-foreground">Actor: Admin</p>
            </section>
            <section className="rounded-2xl border border-border bg-surface-elevated p-4">
              <h3 className="font-semibold">Post snapshot</h3>
              <p className="mt-2 font-semibold">{selectedPost?.title ?? "Post no longer available"}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{selectedPost?.body ?? "No post snapshot available from current database rows."}</p>
              {selectedPost && <dl className="mt-3 grid gap-3 text-xs sm:grid-cols-2"><div><dt className="text-muted-foreground">Place</dt><dd>{selectedPost.place_name || "Unknown place"}</dd></div><div><dt className="text-muted-foreground">Coordinates</dt><dd className="font-mono">{selectedPost.lat.toFixed(5)}, {selectedPost.lng.toFixed(5)}</dd></div><div><dt className="text-muted-foreground">Media</dt><dd>{[selectedPost.image_path && "Photo", selectedPost.music && "Song"].filter(Boolean).join(" + ") || "Text only"}</dd></div><div><dt className="text-muted-foreground">Current state</dt><dd>{statusLabel(selectedPost.status, selectedPost.deleted_at)}</dd></div></dl>}
            </section>
            <section className="rounded-2xl border border-border bg-surface-elevated p-4">
              <h3 className="font-semibold">Status transition</h3>
              <p className="mt-2 text-sm text-muted-foreground">Stored event action: <span className="font-medium text-foreground">{selected.action}</span></p>
              <p className="mt-1 text-sm text-muted-foreground">Current post state: <span className="font-medium text-foreground">{statusLabel(selectedPost?.status, selectedPost?.deleted_at)}</span></p>
            </section>
            <section className="rounded-2xl border border-border bg-surface-elevated p-4">
              <h3 className="font-semibold">Technical details</h3>
              <dl className="mt-3 space-y-2 break-all font-mono text-xs text-muted-foreground"><div><dt>Audit event ID</dt><dd>{selected.id}</dd></div><div><dt>Post ID</dt><dd>{selected.post_id ?? "None"}</dd></div><div><dt>Actor ID</dt><dd>{selected.actor_id ?? "Unknown"}</dd></div><div><dt>Created at</dt><dd>{selected.created_at}</dd></div></dl>
            </section>
          </div>
        </article>
      </AdminModal>}
    </section>
  );
}
