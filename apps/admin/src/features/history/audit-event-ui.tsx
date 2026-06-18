"use client";

import { Archive, Check, FileText, History, MessageSquareWarning, RotateCcw, ShieldCheck, Trash2, X } from "lucide-react";
import type { AuditRow, PostRow } from "@/features/moderation/types";

const meta = {
  visible: { label: "Approved and published", Icon: Check, tone: "bg-green-50 text-green-800" },
  approved: { label: "Approved and published", Icon: Check, tone: "bg-green-50 text-green-800" },
  hidden: { label: "Archived from map", Icon: Archive, tone: "bg-slate-100 text-slate-700" },
  archived: { label: "Archived from map", Icon: Archive, tone: "bg-slate-100 text-slate-700" },
  rejected: { label: "Rejected and kept private", Icon: X, tone: "bg-red-50 text-red-800" },
  flagged: { label: "Flagged by report", Icon: MessageSquareWarning, tone: "bg-red-50 text-red-800" },
  deleted: { label: "Soft deleted", Icon: Trash2, tone: "bg-slate-100 text-slate-700" },
  restored: { label: "Restored", Icon: RotateCcw, tone: "bg-amber-50 text-amber-800" },
  submitted: { label: "Submitted for review", Icon: FileText, tone: "bg-amber-50 text-amber-800" },
  report_dismissed: { label: "Report dismissed", Icon: ShieldCheck, tone: "bg-green-50 text-green-800" },
  report_resolved: { label: "Report resolved", Icon: ShieldCheck, tone: "bg-green-50 text-green-800" },
} as const;

export function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function getAuditMeta(action: string) {
  return meta[action as keyof typeof meta] ?? {
    label: action.replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase()),
    Icon: History,
    tone: "bg-muted text-muted-foreground",
  };
}

export function statusLabel(status?: PostRow["status"] | null, deletedAt?: string | null) {
  if (deletedAt) return "Soft deleted";
  if (status === "pending") return "Waiting for review";
  if (status === "approved") return "Public";
  if (status === "rejected") return "Rejected";
  if (status === "flagged") return "Reported / needs review";
  if (status === "archived") return "Removed from public map";
  return "Unknown";
}

export function AuditEventCard({
  event,
  post,
  onOpen,
}: {
  event: AuditRow;
  post?: PostRow;
  onOpen?: () => void;
}) {
  const eventMeta = getAuditMeta(event.action);
  const title = post?.title ?? "Post no longer available";
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-start gap-3 rounded-2xl border border-border bg-surface p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-muted hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      aria-label={`Open audit event: ${eventMeta.label}`}
    >
      <span className={`mt-0.5 grid size-10 shrink-0 place-items-center rounded-full ${eventMeta.tone}`} aria-hidden>
        <eventMeta.Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-foreground">{eventMeta.label}</span>
        <span className="mt-0.5 block truncate text-sm text-foreground">{title}</span>
        {post && (
          <span className="mt-1 block font-mono text-[11px] text-muted-foreground">
            {post.lat.toFixed(4)}, {post.lng.toFixed(4)}
          </span>
        )}
      </span>
      <span className="shrink-0 text-[11px] text-muted-foreground" title={new Date(event.created_at).toLocaleString()}>{relativeTime(event.created_at)}</span>
    </button>
  );
}
