"use client";

import { createClient } from "@/lib/supabase/browser";
import { LogOut } from "lucide-react";

export function AdminLogoutButton() {
  return (
    <button
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface-elevated px-3 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted md:justify-start"
      onClick={async () => {
        await createClient()?.auth.signOut();
        window.location.assign("/login");
      }}
    >
      <LogOut className="size-4" />
      <span className="hidden md:inline">Sign out</span>
    </button>
  );
}
