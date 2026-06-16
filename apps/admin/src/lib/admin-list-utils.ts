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

export const textareaClass =
  "min-h-24 w-full rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/25";
