"use client";

import { useEffect, useState } from "react";
import { Laptop, Moon, Settings2, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function ThemeSettingsMenu() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button
        variant="secondary"
        size="icon"
        className="size-11 rounded-full border border-black/10 bg-background/95 shadow-lg backdrop-blur-md"
        aria-label="Theme settings"
        disabled
      >
        <Settings2 />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon" className="size-11 rounded-full border border-black/10 bg-background/95 shadow-lg backdrop-blur-md transition-[transform,background-color,box-shadow] duration-200 hover:scale-[1.03] hover:bg-background hover:shadow-xl" aria-label="Theme settings"><Settings2 /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2">
        <DropdownMenuLabel>Map appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light" className="rounded-xl py-2.5"><Sun /> Light</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" className="rounded-xl py-2.5"><Moon /> Dark</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system" className="rounded-xl py-2.5"><Laptop /> System</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
