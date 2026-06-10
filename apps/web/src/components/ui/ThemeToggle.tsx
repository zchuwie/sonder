"use client";

import { FiMoon, FiSun } from "react-icons/fi";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={
        isDark
          ? "Switch to light mode (Liberty)"
          : "Switch to dark mode (Fiord)"
      }
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium shadow-md transition-all duration-200 cursor-pointer"
      style={{
        background: "var(--card)",
        color: "var(--foreground)",
        border: "1px solid var(--border)",
      }}
    >
      {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
      <span>{isDark ? "Liberty" : "Fiord"}</span>
    </button>
  );
}
