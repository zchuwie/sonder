"use client";

import { useEffect, useState } from "react";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

const options = [
  ["light", "Light", Sun],
  ["dark", "Dark", Moon],
  ["system", "System", Laptop],
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-9 rounded-xl bg-muted" aria-hidden />;

  return (
    <div className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-muted p-1" aria-label="Color theme">
      {options.map(([value, label, Icon]) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          aria-pressed={theme === value}
          title={label}
          className={`grid h-7 place-items-center rounded-lg transition ${theme === value ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Icon className="size-3.5" />
          <span className="sr-only">{label}</span>
        </button>
      ))}
    </div>
  );
}
