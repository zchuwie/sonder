"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, Eye, EyeOff, History, MessageSquareWarning } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { AuditEventCard } from "@/features/history/audit-event-ui";
import { fetchAuditHistory, fetchPosts, fetchReports } from "@/features/moderation/admin-queries";
import { PostVisual } from "@/features/moderation/PostVisual";
import type { AuditRow, PostRow, ReportRow } from "@/features/moderation/types";
import { useAdminRealtime } from "@/features/realtime/use-admin-realtime";

const flowChartConfig = {
  posts: { label: "Posts", color: "var(--primary)" },
  reports: { label: "Reports", color: "var(--danger)" },
} satisfies ChartConfig;

const statusChartConfig = {
  value: { label: "Posts", color: "var(--primary)" },
} satisfies ChartConfig;

function dayKey(value: string) {
  const d = new Date(value);
  // ponytail: short labels fit 320px. Full "Jun 11" overflows small charts.
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
  const statusCounts = useMemo(() => {
    const rows = [
      ["Pending", pending.length, "bg-amber-400"],
      ["Approved", posts.filter((post) => post.status === "approved" && !post.deleted_at).length, "bg-green-700"],
      ["Flagged", posts.filter((post) => post.status === "flagged" && !post.deleted_at).length, "bg-red-500"],
      ["Archived", posts.filter((post) => post.status === "archived").length, "bg-slate-500"],
    ] as const;
    return rows.map(([label, value, color]) => ({ label, value, color }));
  }, [pending.length, posts]);
  const dailyActivity = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return { key: date.toDateString(), label: dayKey(date.toISOString()), posts: 0, reports: 0 };
    });
    posts.forEach((post) => { const day = days.find((item) => item.key === new Date(post.created_at).toDateString()); if (day) day.posts += 1; });
    reports.forEach((report) => { const day = days.find((item) => item.key === new Date(report.created_at).toDateString()); if (day) day.reports += 1; });
    return days;
  }, [posts, reports]);

  const cards = [
    ["Pending review", pending.length, "Needs decision", "/posts", Clock3],
    ["Approved posts", posts.filter((post) => post.status === "approved" && !post.deleted_at).length, "Live on map", "/posts", Eye],
    ["Open reports", openReports.length, `${reportedPosts} affected posts`, "/reports", MessageSquareWarning],
    ["Actions logged", history.length, "Latest 200 actions", "/history", History],
    ["Archived posts", posts.filter((post) => post.status === "archived").length, "Recoverable posts", "/posts?status=archived", EyeOff],
  ] as const;

  return (
    <section className="mx-auto w-full max-w-[1500px]">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-green-700">Overview</p>
          <h1 className="mt-1 font-serif text-xl text-foreground md:text-3xl">Dashboard</h1>
          <p className="mt-1 text-xs text-muted-foreground md:text-sm">Moderation queue, safety signals, and recent decisions.</p>
        </div>
        <Link
          href="/posts"
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover"
        >
          Review pending <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {error && <p className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {/* Metric cards — 2-col mobile, 3-col sm, 5-col xl */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
        {cards.map(([label, value, note, href, Icon], i) => (
          <Link
            key={label}
            href={href}
            className={`group rounded-2xl border border-border bg-surface p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md md:p-4 ${
              // last card spans 2 cols on mobile when 5 items in 2-col grid
              i === 4 ? "col-span-2 sm:col-span-1" : ""
            }`}
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
      <div className="mt-3 grid gap-3 xl:grid-cols-[1.55fr_.85fr]">
        {/* Next in queue */}
        <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm md:rounded-3xl md:p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold md:text-lg">Next in queue</h2>
              <p className="text-xs text-muted-foreground md:text-sm">Newest pending thoughts.</p>
            </div>
            <Link href="/posts" className="shrink-0 text-xs font-semibold text-green-700">View all</Link>
          </div>
          <div className="mt-3 space-y-1.5">
            {pending.slice(0, 5).map((post) => (
              <Link
                href={`/posts?post=${post.id}`}
                key={post.id}
                className="flex items-center gap-2.5 rounded-xl border border-transparent p-2 transition hover:border-border hover:bg-muted"
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
                <span className="hidden shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 sm:inline">Pending</span>
              </Link>
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

        <div className="space-y-3">
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
    </section>
  );
}
