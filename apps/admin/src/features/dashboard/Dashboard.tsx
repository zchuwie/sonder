"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, Clock3, Eye, EyeOff, History, MessageSquareWarning, X } from "lucide-react";
import { fetchAuditHistory, fetchPosts, fetchReports } from "@/features/moderation/admin-queries";
import { PostVisual } from "@/features/moderation/PostVisual";
import type { AuditRow, PostRow, ReportRow } from "@/features/moderation/types";
import { useAdminRealtime } from "@/features/realtime/use-admin-realtime";

const activityMeta = {
  visible: { label: "Approved and published", Icon: Check, tone: "bg-green-50 text-green-800" },
  rejected: { label: "Rejected and kept private", Icon: X, tone: "bg-red-50 text-red-800" },
  hidden: { label: "Hidden from public map", Icon: EyeOff, tone: "bg-slate-100 text-slate-700" },
  archived: { label: "Archived and recoverable", Icon: EyeOff, tone: "bg-slate-100 text-slate-700" },
  restored: { label: "Restored to pending review", Icon: Clock3, tone: "bg-amber-50 text-amber-800" },
} as const;

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function Dashboard() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [history, setHistory] = useState<AuditRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetchPosts(), fetchReports(), fetchAuditHistory()])
      .then(([postRows, reportRows, auditRows]) => {
        setPosts(postRows);
        setReports(reportRows);
        setHistory(auditRows);
      })
      .catch(() => setError("Dashboard data could not be loaded."));
  }, []);
  useAdminRealtime(["posts", "post_reports", "moderation_events"], () => {
    Promise.all([fetchPosts(), fetchReports(), fetchAuditHistory()])
      .then(([postRows, reportRows, auditRows]) => {
        setPosts(postRows); setReports(reportRows); setHistory(auditRows);
      })
      .catch(() => setError("Dashboard data could not be refreshed."));
  });

  const pending = posts.filter((post) => post.status === "pending");
  const openReports = reports.filter((report) => report.status === "open");
  const reportedPosts = new Set(openReports.map((report) => report.post_id)).size;
  const reportReasons = useMemo(() => {
    const counts = new Map<string, number>();
    openReports.forEach((report) => counts.set(report.reason, (counts.get(report.reason) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [openReports]);

  const cards = [
    ["Pending review", pending.length, "Needs decision", "/posts", Clock3],
    ["Visible posts", posts.filter((post) => post.status === "visible").length, "Live on map", "/posts", Eye],
    ["Open reports", openReports.length, `${reportedPosts} affected posts`, "/reports", MessageSquareWarning],
    ["Actions logged", history.length, "Latest 200 actions", "/history", History],
    ["Archived posts", posts.filter((post) => post.archived_at).length, "Recoverable posts", "/posts?status=archived", EyeOff],
  ] as const;

  return (
    <section className="mx-auto max-w-[1500px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-700">Overview</p>
          <h1 className="mt-2 font-serif text-4xl text-foreground">Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">Moderation queue, safety signals, and recent decisions.</p>
        </div>
        <Link href="/posts" className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover">
          Review pending <ArrowRight className="size-4" />
        </Link>
      </div>

      {error && <p className="mt-5 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(([label, value, note, href, Icon]) => (
          <Link key={label} href={href} className="group rounded-2xl border border-border bg-surface p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between">
              <p className="text-sm font-semibold text-foreground">{label}</p>
              <span className="grid size-9 place-items-center rounded-xl bg-accent text-accent-foreground"><Icon className="size-4" /></span>
            </div>
            <p className="mt-4 text-3xl font-semibold text-foreground">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{note}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.55fr_.85fr]">
        <section className="rounded-3xl border border-[#dce3d8] bg-[#fbfcf8] p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div><h2 className="text-xl font-semibold">Next in queue</h2><p className="mt-1 text-sm text-slate-600">Newest pending thoughts.</p></div>
            <Link href="/posts" className="text-sm font-semibold text-green-700">View all</Link>
          </div>
          <div className="mt-5 space-y-2">
            {pending.slice(0, 5).map((post) => (
              <Link href={`/posts?post=${post.id}`} key={post.id} className="grid gap-3 rounded-2xl border border-transparent p-2.5 transition hover:border-[#dce3d8] hover:bg-white sm:grid-cols-[84px_1fr_auto] sm:items-center">
                <PostVisual post={post} compact />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{post.title}</p>
                  <p className="mt-1 line-clamp-1 text-sm text-slate-600">{post.body}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{post.lat.toFixed(4)}, {post.lng.toFixed(4)} · {new Date(post.created_at).toLocaleDateString()}</p>
                </div>
                <span className="hidden rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 sm:inline">Pending</span>
              </Link>
            ))}
            {!pending.length && <div className="grid min-h-48 place-items-center rounded-2xl border border-dashed border-[#cfdacb] bg-[#f5f8f2] text-center"><div><CheckCircle2 className="mx-auto size-7 text-green-700" /><p className="mt-2 text-sm font-semibold">Queue clear</p><p className="mt-1 text-xs text-slate-500">No posts waiting.</p></div></div>}
          </div>
        </section>

        <div className="space-y-5">
          <section className="rounded-3xl border border-[#dce3d8] bg-[#fbfcf8] p-5 shadow-sm">
            <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Report signals</h2><Link href="/reports" className="text-xs font-semibold text-green-700">Review</Link></div>
            <div className="mt-4 space-y-2">{reportReasons.map(([reason, count]) => <div key={reason} className="flex items-center justify-between rounded-xl bg-[#f0f4ed] px-3 py-2.5"><span className="text-sm capitalize">{reason.replaceAll("_", " ")}</span><strong className="text-green-800">{count}</strong></div>)}{!reportReasons.length && <p className="text-sm text-slate-600">No open reports.</p>}</div>
          </section>
          <section className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="text-lg font-semibold">Recent decisions</h2><p className="mt-0.5 text-xs text-muted-foreground">Latest moderation actions.</p></div><Link href="/history" className="flex items-center gap-1 text-xs font-semibold text-green-700">View history <ArrowRight className="size-3" /></Link></div>
            <div className="divide-y divide-border">{history.slice(0, 4).map((event) => {
              const meta = activityMeta[event.action as keyof typeof activityMeta] ?? { label: event.action.replaceAll("_", " "), Icon: History, tone: "bg-muted text-muted-foreground" };
              const post = posts.find((item) => item.id === event.post_id);
              return <Link href="/history" key={event.id} className="group flex items-start gap-3 px-5 py-3 transition hover:bg-muted">
                <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ${meta.tone}`}><meta.Icon className="size-3.5" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold capitalize">{meta.label}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{post?.title ?? "Post no longer available"}{event.reason ? ` · ${event.reason}` : ""}</span></span>
                <span className="shrink-0 text-[11px] text-muted-foreground" title={new Date(event.created_at).toLocaleString()}>{relativeTime(event.created_at)}</span>
              </Link>;
            })}{!history.length && <div className="px-5 py-8 text-center"><History className="mx-auto size-5 text-muted-foreground" /><p className="mt-2 text-sm font-semibold">No decisions yet</p><p className="mt-1 text-xs text-muted-foreground">Moderation actions will appear here.</p></div>}</div>
          </section>
        </div>
      </div>
    </section>
  );
}
