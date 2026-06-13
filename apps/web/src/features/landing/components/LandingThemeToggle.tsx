"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function LandingThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      className="flex size-9 items-center justify-center rounded-full border border-black/10 bg-white/60 text-[#101713] transition hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-[#f5f1e8] dark:hover:bg-white/10"
      aria-label={isDark ? "Use light landing theme" : "Use dark landing theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      disabled={!mounted}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
