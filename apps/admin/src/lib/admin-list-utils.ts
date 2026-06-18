export type DateRange = "all" | "today" | "7d" | "30d";

export function isWithinDateRange(value: string, range: DateRange) {
  if (range === "all") return true;
  const date = new Date(value);
  const now = new Date();
  if (range === "today") return date.toDateString() === now.toDateString();
  const days = range === "7d" ? 7 : 30;
  return date.getTime() >= now.getTime() - days * 86_400_000;
}

export const controlClass =
  "h-11 rounded-xl border border-border bg-surface-elevated px-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/25";

export const toolButtonClass =
  "h-11 rounded-xl border border-border bg-surface-elevated px-3 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted";

export const primaryButtonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover disabled:opacity-55";

export const secondaryButtonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-surface-elevated px-4 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted disabled:opacity-55";

export const dangerButtonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-danger px-4 text-sm font-semibold text-danger-foreground shadow-sm transition hover:bg-danger-hover disabled:opacity-55";

export const iconButtonClass =
  "grid size-9 place-items-center rounded-xl border border-border bg-surface-elevated text-foreground shadow-sm transition hover:bg-muted disabled:opacity-55";

export const panelClass =
  "absolute right-0 z-20 mt-2 w-64 rounded-2xl border border-border bg-surface-elevated p-3 shadow-xl";

export const textareaClass =
  "min-h-24 w-full rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/25";
