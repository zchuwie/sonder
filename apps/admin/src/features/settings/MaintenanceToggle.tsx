"use client";

import { useEffect, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/browser";

export function MaintenanceToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    // ponytail: cast to any — site_settings table exists after migration but types aren't regenerated yet
    (supabase as any)
      .from("site_settings")
      .select("value")
      .eq("key", "maintenance_mode")
      .single()
      .then(({ data }: { data: { value: boolean } | null }) => {
        setEnabled(data?.value === true);
        setLoading(false);
      });
  }, []);

  function toggle() {
    const next = !enabled;
    startTransition(async () => {
      const supabase = createClient();
      if (!supabase) return;
      const { error } = await (supabase as any)
        .from("site_settings")
        .update({ value: next, updated_at: new Date().toISOString() })
        .eq("key", "maintenance_mode");
      if (!error) setEnabled(next);
    });
  }

  if (loading) return <div className="h-20 animate-pulse rounded-2xl bg-muted" />;

  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm transition-colors ${
        enabled
          ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
          : "border-border bg-surface"
      }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Maintenance Mode</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {enabled
              ? "The public site is DOWN. All visitors see a maintenance page."
              : "The public site is live and accessible."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          disabled={isPending}
          onClick={toggle}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${
            enabled ? "bg-red-600" : "bg-muted"
          }`}
        >
          <span
            className={`pointer-events-none block size-5 rounded-full bg-white shadow-sm transition-transform ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
      {enabled && (
        <p className="mt-3 text-xs font-medium text-red-700 dark:text-red-400">
          ⚠️ Flip this off when you&apos;re ready to bring the site back up.
        </p>
      )}
    </div>
  );
}
