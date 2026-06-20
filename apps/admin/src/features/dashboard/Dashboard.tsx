"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, Clock3, Eye, EyeOff, History, MapPin, MessageSquareWarning, Users, X, XCircle } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { AdminModal } from "@/components/ui/admin-modal";
import { AuditEventCard } from "@/features/history/audit-event-ui";
import { fetchAuditHistory, fetchPosts, fetchReports, moderatePost } from "@/features/moderation/admin-queries";
import { MusicCard, PostVisual } from "@/features/moderation/PostVisual";
import { AdminLocationMap } from "@/features/locations/AdminLocationMap";
import { useLocationLabels } from "@/features/locations/use-location-labels";
import type { AuditRow, PostRow, ReportRow } from "@/features/moderation/types";
import { useAdminRealtime } from "@/features/realtime/use-admin-realtime";
import { primaryButtonClass, secondaryButtonClass, textareaClass, type DateRange, isWithinDateRange } from "@/lib/admin-list-utils";

const flowChartConfig = {
  posts: { label: "Posts", color: "var(--primary)" },
  reports: { label: "Reports", color: "var(--danger)" },
} satisfies ChartConfig;

const statusChartConfig = {
  value: { label: "Posts", color: "var(--primary)" },
} satisfies ChartConfig;

function dayKey(value: string) {
  const d = new Date(value);
  return `${d.getDate()}`;
}

function StatusBarChart({ data }: { data: { label: string; value: number }[] }) {
  return (
    <BarChart data={data} layout="vertical" margin={{ left: 8, right: 8, top: 4, bottom: 4 }}>
      <CartesianGrid horizontal={false} />
      <XAxis type="number" hide allowDecimals={false} />
      <YAxis dataKey="label" type="category" tickLine={false} axisLine={false} width={68} tick={{ fontSize: 11 }} />
      <ChartTooltip content={<ChartTooltipContent />} />
      <Bar dataKey="value" name="Posts" fill="var(--color-value)" radius={6} />
    </BarChart>
  );
}

// Mobile-friendly status distribution — simple progress bars
function MobileStatusList({ statusCounts }: { statusCounts: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...statusCounts.map((s) => s.value), 1);
  return (
    <div className="mt-3 space-y-2.5">
      {statusCounts.map(({ label, value, color }) => (
        <div key={label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">{label}</span>
            <span className="font-semibold text-foreground">{value}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${color} transition-all`}
              style={{ width: `${(value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Dashboard() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [history, setHistory] = useState<AuditRow[]>([]);
  const [selected, setSelected] = useState<PostRow | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeUsers, setActiveUsers] = useState(0);
  const locationLabel = useLocationLabels(posts);

  const load = () =>
    Promise.all([fetchPosts(), fetchReports(), fetchAuditHistory()])
      .then(([postRows, reportRows, auditRows]) => {
        setPosts(postRows); setReports(reportRows); setHistory(auditRows);
      })
      .catch(() => setError("Dashboard data could not be loaded."));

  useEffect(() => { void load(); }, []);

  useAdminRealtime(["posts", "post_reports", "moderation_events"], () => {
    void load();
  });

  // Poll active users every 30s
  useEffect(() => {
    async function fetchActive() {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!url || !key) return;
        const since = new Date(Date.now() - 2 * 60_000).toISOString();
        const res = await fetch(
          `${url}/rest/v1/heartbeats?last_seen=gte.${since}&select=user_id`,
          { headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact" } },
        );
        const count = res.headers.get("content-range")?.split("/")[1];
        setActiveUsers(count ? parseInt(count, 10) : 0);
      } catch { /* silent */ }
    }
    void fetchActive();
    const timer = setInterval(fetchActive, 30_000);
    return () => clearInterval(timer);
  }, []);

  async function decide(post: PostRow, nextStatus: "approved" | "rejected") {
    try {
      await moderatePost(post.id, nextStatus, reason);
      setSelected(null); setReason(""); void load();
    } catch { setError("Moderation action failed."); }
  }

  const pending = posts.filter((post) => post.status === "pending" && !post.deleted_at && isWithinDateRange(post.created_at, dateRange, dateFrom, dateTo));
  const filteredPosts = posts.filter((post) => !post.deleted_at && isWithinDateRange(post.created_at, dateRange, dateFrom, dateTo));
  const filteredReports = reports.filter((report) => isWithinDateRange(report.created_at, dateRange, dateFrom, dateTo));
  const openReports = filteredReports.filter((report) => report.status === "open");
  const reportedPosts = new Set(openReports.map((report) => report.post_id)).size;
  const reportReasons = useMemo(() => {
    const counts = new Map<string, number>();
    openReports.forEach((report) => counts.set(report.reason, (counts.get(report.reason) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [openReports]);

  const statusCounts = useMemo(() => {
    const rows = [
      ["Pending", pending.length, "bg-amber-400"],
      ["Approved", filteredPosts.filter((post) => post.status === "approved").length, "bg-green-700"],
      ["Flagged", filteredPosts.filter((post) => post.status === "flagged").length, "bg-red-500"],
      ["Archived", filteredPosts.filter((post) => post.status === "archived").length, "bg-slate-500"],
    ] as const;
    return rows.map(([label, value, color]) => ({ label, value, color }));
  }, [pending.length, filteredPosts]);

  const dailyActivity = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return { key: date.toDateString(), label: dayKey(date.toISOString()), posts: 0, reports: 0 };
    });

    posts.filter((post) => !post.deleted_at).forEach((post) => { const day = days.find((item) => item.key === new Date(post.created_at).toDateString()); if (day) day.posts += 1; });
    reports.forEach((report) => { const day = days.find((item) => item.key === new Date(report.created_at).toDateString()); if (day) day.reports += 1; });
    return days;
  }, [posts, reports]);

  const cards = [
    ["Active now", activeUsers, "On Sonder right now", "/", Users],
    ["Pending review", pending.length, "Needs decision", "/posts", Clock3],
    ["Approved posts", filteredPosts.filter((post) => post.status === "approved").length, "Live on map", "/posts", Eye],
    ["Open reports", openReports.length, `${reportedPosts} affected posts`, "/reports", MessageSquareWarning],
    ["Actions logged", history.length, "Latest 200 actions", "/history", History],
    ["Archived posts", filteredPosts.filter((post) => post.status === "archived").length, "Recoverable posts", "/posts?status=archived", EyeOff],
  ] as const;

  return (
    <section className="mx-auto w-full max-w-full overflow-hidden">
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {/* Date range filter */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(["all", "today", "7d", "30d"] as const).map((range) => (
          <button
            key={range}
            type="button"
            onClick={() => { setDateRange(range); setDateFrom(""); setDateTo(""); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              dateRange === range
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            {range === "all" ? "All" : range === "today" ? "Today" : range === "7d" ? "7d" : "30d"}
          </button>
        ))}
        <span className="text-xs text-muted-foreground">or</span>
        <input
          type="date"
          aria-label="From date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setDateRange("custom"); }}
          className="h-8 rounded-lg border border-border bg-surface-elevated px-2 text-xs"
        />
        <span className="text-xs text-muted-foreground">–</span>
        <input
          type="date"
          aria-label="To date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setDateRange("custom"); }}
          className="h-8 rounded-lg border border-border bg-surface-elevated px-2 text-xs"
        />
      </div>

      {/* Metric cards — 2-col mobile, 3-col sm, 6-col xl */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {cards.map(([label, value, note, href, Icon]) => (
          <Link
            key={label}
            href={href}
            className="group rounded-2xl border border-border bg-surface p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:p-4"
          >
            <div className="flex items-start justify-between gap-1">
              <p className="text-xs font-semibold text-foreground md:text-sm">{label}</p>
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground md:size-8">
                <Icon className="size-3.5 md:size-4" />
              </span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-foreground md:mt-3">{value}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground md:text-xs">{note}</p>
          </Link>
        ))}
      </div>

      {/* Main grid */}
      <div className="mt-3 grid gap-3 overflow-hidden xl:grid-cols-[1.55fr_.85fr]">
        {/* Next in queue */}
        <section className="overflow-hidden rounded-2xl border border-border bg-surface p-4 shadow-sm md:rounded-3xl md:p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold md:text-lg">Next in queue</h2>
              <p className="text-xs text-muted-foreground md:text-sm">Newest pending thoughts.</p>
            </div>
            <Link href="/posts" className="shrink-0 text-xs font-semibold text-green-700">View all</Link>
          </div>
          <div className="mt-3 space-y-1.5">
            {pending.slice(0, 5).map((post) => (
              <div
                key={post.id}
                onClick={() => setSelected(post)}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-transparent p-2 transition hover:border-border hover:bg-muted"
              >
                <div className="w-14 shrink-0 md:w-20">
                  <PostVisual post={post} compact />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{post.title}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{post.body}</p>
                  <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                    {post.lat.toFixed(3)}, {post.lng.toFixed(3)} · {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    aria-label="Reject"
                    title="Reject"
                    onClick={() => void decide(post, "rejected")}
                    className="grid size-7 place-items-center rounded-md border border-danger text-danger transition hover:bg-danger-surface"
                  >
                    <X className="size-3" />
                  </button>
                  <button
                    type="button"
                    aria-label="Approve"
                    title="Approve"
                    onClick={() => void decide(post, "approved")}
                    className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground transition hover:bg-primary-hover"
                  >
                    <Check className="size-3" />
                  </button>
                </div>
              </div>
            ))}
            {!pending.length && (
              <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/50 px-4 py-5">
                <CheckCircle2 className="size-5 shrink-0 text-green-700" />
                <div>
                  <p className="text-sm font-semibold">Queue clear</p>
                  <p className="text-xs text-muted-foreground">No posts waiting.</p>
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="min-w-0 space-y-3">
          {/* 7-day flow chart */}
          <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm md:rounded-3xl md:p-5">
            <h2 className="text-sm font-semibold md:text-base">7-day flow</h2>
            <div className="mt-3 max-w-full">
              <ChartContainer config={flowChartConfig} className="h-[180px] w-full md:h-[200px]">
                <AreaChart data={dailyActivity} margin={{ left: -4, right: 4, top: 6, bottom: 0 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={4}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis hide allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area dataKey="posts" name="Posts" type="monotone" fill="var(--color-posts)" fillOpacity={0.18} stroke="var(--color-posts)" strokeWidth={2} />
                  <Area dataKey="reports" name="Reports" type="monotone" fill="var(--color-reports)" fillOpacity={0.12} stroke="var(--color-reports)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </div>
          </section>

          {/* Post status — progress bars on mobile, chart on md+ */}
          <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm md:rounded-3xl md:p-5">
            <h2 className="text-sm font-semibold md:text-base">Post status</h2>
            {/* Mobile: progress bar list */}
            <div className="md:hidden">
              <MobileStatusList statusCounts={statusCounts} />
            </div>
            {/* Desktop: recharts bar chart */}
            <div className="hidden md:block">
              <ChartContainer config={statusChartConfig} className="mt-3 h-[160px] w-full">
                <StatusBarChart data={statusCounts} />
              </ChartContainer>
            </div>
          </section>

          {/* Report signals */}
          <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm md:rounded-3xl md:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold md:text-base">Report signals</h2>
              <Link href="/reports" className="text-xs font-semibold text-green-700">Review</Link>
            </div>
            <div className="mt-3 space-y-1.5">
              {reportReasons.map(([reason, count]) => (
                <div key={reason} className="flex items-center justify-between rounded-xl bg-muted px-3 py-2">
                  <span className="text-xs capitalize md:text-sm">{reason.replaceAll("_", " ")}</span>
                  <strong className="text-xs text-green-800 md:text-sm">{count}</strong>
                </div>
              ))}
              {!reportReasons.length && <p className="text-xs text-muted-foreground md:text-sm">No open reports.</p>}
            </div>
          </section>

          {/* Recent decisions */}
          <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm md:rounded-3xl">
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3 md:px-5 md:py-4">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold md:text-base">Recent decisions</h2>
                <p className="text-[11px] text-muted-foreground md:text-xs">Latest moderation actions.</p>
              </div>
              <Link href="/history" className="flex shrink-0 items-center gap-1 text-xs font-semibold text-green-700">
                <span className="sm:hidden">View</span>
                <span className="hidden sm:inline">View history</span>
                <ArrowRight className="size-3" />
              </Link>
            </div>
            <div className="space-y-1.5 p-2.5">
              {history.slice(0, 4).map((event) => (
                <AuditEventCard key={event.id} event={event} post={event.post_id ? posts.find((item) => item.id === event.post_id) : undefined} />
              ))}
              {!history.length && (
                <div className="px-4 py-6 text-center">
                  <History className="mx-auto size-5 text-muted-foreground" />
                  <p className="mt-2 text-sm font-semibold">No decisions yet</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Moderation actions will appear here.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Post detail modal — mirrors ModerationTable */}
      {selected && (
        <AdminModal onClose={() => setSelected(null)}>
          <article role="dialog" aria-modal="true" aria-labelledby="dash-post-title" className="relative flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <header className="flex justify-between gap-4 border-b border-border p-4 sm:p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-green-700">{selected.status} post</p>
                <h2 id="dash-post-title" className="mt-2 text-2xl font-semibold">{selected.title}</h2>
              </div>
              <button aria-label="Close" onClick={() => setSelected(null)} className="grid size-10 place-items-center rounded-full border bg-white text-slate-600"><X className="size-4" /></button>
            </header>
            <div className="min-h-0 overflow-y-auto p-4 sm:p-6">
              <div className="grid items-start gap-5 lg:grid-cols-[1.05fr_.95fr]">
                <div className="space-y-4">
                  {selected.image_path && <PostVisual post={selected} />}
                  <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-green-700">Thought</p>
                    <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-foreground">{selected.body}</p>
                  </section>
                  {selected.music && <MusicCard post={selected} />}
                </div>
                <section className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <MapPin className="size-4 text-green-700" />
                    <div>
                      <h3 className="text-sm font-semibold">Pinned coordinates</h3>
                      <p className="font-mono text-xs text-slate-600">{locationLabel(selected)}</p>
                    </div>
                  </div>
                  <div className="h-72 overflow-hidden rounded-xl border border-border bg-muted">
                    <AdminLocationMap posts={[selected]} selectedId={selected.id} reportCounts={{}} onSelect={() => undefined} compact />
                  </div>
                </section>
              </div>
              {selected.status === "pending" && (
                <label className="mt-5 block text-sm font-medium">
                  Moderation reason <span className="font-normal text-slate-600">Optional note for audit history.</span>
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} className={`mt-2 ${textareaClass}`} />
                </label>
              )}
            </div>
            {selected.status === "pending" && (
              <footer className="grid gap-2 border-t border-border bg-surface p-4 sm:grid-cols-2 sm:px-6">
                <button onClick={() => void decide(selected, "rejected")} className={`${secondaryButtonClass} border-danger text-danger hover:bg-danger-surface`}><XCircle className="size-4" />Reject</button>
                <button onClick={() => void decide(selected, "approved")} className={primaryButtonClass}><Check className="size-4" />Approve</button>
              </footer>
            )}
          </article>
        </AdminModal>
      )}
    </section>
  );
}
