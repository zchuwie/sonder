"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardCheck,
  Clock3,
  LayoutDashboard,
  MapPinned,
  MessageSquareWarning,
} from "lucide-react";
import { AdminLogoutButton } from "@/features/auth/AdminLogoutButton";
import { ThemeToggle } from "@/components/theme-toggle";

const links = [
  ["/", "Dashboard", LayoutDashboard],
  ["/posts", "Pending posts", ClipboardCheck],
  ["/locations", "Locations", MapPinned],
  ["/reports", "Reports", MessageSquareWarning],
  ["/history", "Audit history", Clock3],
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-background text-foreground md:grid md:grid-cols-[224px_1fr]">
      <aside className="flex flex-col border-b border-border bg-surface p-4 md:sticky md:top-0 md:h-dvh md:border-b-0 md:border-r md:p-4">
        <div className="flex w-full items-center justify-between md:block">
          <div>
            <p className="font-serif text-2xl text-foreground">Sonder<span className="text-primary">.</span></p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Admin workspace</p>
          </div>
        </div>
        <nav className="mt-5 grid flex-1 grid-cols-5 gap-2 overflow-x-auto md:grid-cols-1 md:content-start">
          {links.map(([href, label, Icon]) => {
            const active = href === "/" ? pathname === href : pathname.startsWith(href);
            return (
            <Link
              key={href}
              href={href}
              className={`flex min-w-max items-center justify-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition md:justify-start ${
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="size-4" strokeWidth={1.8} />
              <span className="hidden md:inline">{label}</span>
            </Link>
          )})}
        </nav>
        <div className="mt-4 space-y-3 border-t border-border pt-4 md:mt-auto">
          <ThemeToggle />
          <p className="hidden text-xs leading-5 text-muted-foreground md:block">Review carefully. Every action becomes part of audit history.</p>
          <AdminLogoutButton />
        </div>
      </aside>
      <main className="min-w-0 p-4 sm:p-5 lg:p-6 xl:p-7">{children}</main>
    </div>
  );
}
