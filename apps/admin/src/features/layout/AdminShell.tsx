"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardCheck,
  Clock3,
  LayoutDashboard,
  MapPinned,
  MessageSquareWarning,
  Settings,
} from "lucide-react";
import { AdminLogoutButton } from "@/features/auth/AdminLogoutButton";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  ["/", "Dashboard", LayoutDashboard],
  ["/posts", "Pending posts", ClipboardCheck],
  ["/locations", "Locations", MapPinned],
  ["/reports", "Reports", MessageSquareWarning],
  ["/history", "Audit history", Clock3],
  ["/settings", "Settings", Settings],
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh overflow-x-hidden bg-background text-foreground md:grid md:grid-cols-[200px_1fr] md:gap-3 md:p-3">
      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
        <p className="font-serif text-xl text-foreground">Sonder<span className="text-primary">.</span></p>
        <ThemeToggle />
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden flex-col rounded-2xl border border-border bg-surface p-4 shadow-sm md:sticky md:top-3 md:flex md:h-[calc(100dvh-1.5rem)]">
        <div>
          <p className="font-serif text-2xl text-foreground">Sonder<span className="text-primary">.</span></p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Admin workspace</p>
        </div>
        <nav className="mt-5 grid flex-1 grid-cols-1 content-start gap-1">
          {links.map(([href, label, Icon]) => {
            const active = href === "/" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="size-4" strokeWidth={1.8} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto space-y-3 border-t border-border pt-4">
          <ThemeToggle />
          <p className="text-xs leading-5 text-muted-foreground">Review carefully. Every action becomes part of audit history.</p>
          <AdminLogoutButton />
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-surface md:hidden">
        {links.map(([href, label, Icon]) => {
          const active = href === "/" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition ${
                active ? "text-accent-foreground" : "text-muted-foreground"
              }`}
            >
              <span className={`rounded-xl p-1.5 ${active ? "bg-accent" : ""}`}>
                <Icon className="size-4" strokeWidth={1.8} />
              </span>
              <span className="leading-none">{label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>

      <main className="min-w-0 overflow-x-hidden p-3 pb-20 md:pb-3 md:pt-0">{children}</main>
    </div>
  );
}
