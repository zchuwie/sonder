"use client";
import { useEffect, useMemo, useState } from "react";
import { fetchAuditHistory } from "@/features/moderation/admin-queries";
import type { AuditRow } from "@/features/moderation/types";
import { controlClass, isWithinDateRange, type DateRange } from "@/lib/admin-list-utils";
import { useAdminRealtime } from "@/features/realtime/use-admin-realtime";

export function AuditHistory() {
  const [events, setEvents] = useState<AuditRow[]>([]), [query, setQuery] = useState(""), [action, setAction] = useState("all");
  const [date, setDate] = useState<DateRange>("all"), [sort, setSort] = useState<"newest"|"oldest"|"action">("newest"), [error, setError] = useState("");
  useEffect(() => { fetchAuditHistory().then(setEvents).catch(() => setError("Audit history could not be loaded.")); }, []);
  useAdminRealtime(["moderation_events"], () => {
    fetchAuditHistory().then(setEvents).catch(() => setError("Audit history could not be refreshed."));
  });
  const actions = useMemo(() => [...new Set(events.map((event) => event.action))].sort(), [events]);
  const visible = useMemo(() => events.filter((event) => action === "all" || event.action === action).filter((event) => isWithinDateRange(event.created_at, date)).filter((event) => `${event.post_id} ${event.actor_id} ${event.reason} ${event.action}`.toLowerCase().includes(query.toLowerCase())).sort((a,b) => sort === "oldest" ? a.created_at.localeCompare(b.created_at) : sort === "action" ? a.action.localeCompare(b.action) : b.created_at.localeCompare(a.created_at)), [action,date,events,query,sort]);
  return <section><p className="text-xs font-bold uppercase tracking-[0.2em] text-green-700">Accountability</p><h1 className="mt-2 text-3xl font-semibold">Audit history</h1><p className="mt-2 text-sm text-slate-600">Automatic log of admin moderation changes.</p>
    <div className="mt-5 grid gap-2 rounded-2xl border bg-[#fbfcf8] p-3 shadow-sm sm:grid-cols-2 xl:grid-cols-[1.5fr_repeat(3,1fr)_auto]"><input aria-label="Search history" value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search post, actor, reason..." className={controlClass}/><select aria-label="Action" value={action} onChange={(e)=>setAction(e.target.value)} className={controlClass}><option value="all">All actions</option>{actions.map((v)=><option key={v}>{v}</option>)}</select><select aria-label="Date" value={date} onChange={(e)=>setDate(e.target.value as DateRange)} className={controlClass}><option value="all">All time</option><option value="today">Today</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></select><select aria-label="Sort" value={sort} onChange={(e)=>setSort(e.target.value as typeof sort)} className={controlClass}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="action">Action type</option></select><button onClick={()=>{setQuery("");setAction("all");setDate("all");setSort("newest")}} className="h-11 rounded-xl border bg-white px-4 text-sm font-semibold">Reset</button></div>
    {error&&<p className="mt-5 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}<div className="mt-4 space-y-3">{visible.map((event)=><article key={event.id} className="rounded-2xl border bg-[#fbfcf8] p-4 shadow-sm"><div className="flex flex-wrap justify-between gap-2"><p className="font-semibold capitalize">{event.action}</p><time className="text-xs text-slate-500">{new Date(event.created_at).toLocaleString()}</time></div><p className="mt-2 break-all font-mono text-xs text-slate-600">Post: {event.post_id??"Deleted post"} | Actor: {event.actor_id??"Unknown"}</p>{event.reason&&<p className="mt-2 text-sm">{event.reason}</p>}</article>)}{!visible.length&&<p className="rounded-2xl border border-dashed p-10 text-center text-sm text-slate-600">No audit events match filters.</p>}</div></section>;
}
