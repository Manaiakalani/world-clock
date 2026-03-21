"use client";

import { Moon, Sun, Globe } from "lucide-react";
import { useTheme } from "next-themes";
import { formatDate } from "@/lib/timezone-utils";

interface HeaderProps {
  now: Date;
}

export function Header({ now }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Globe className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">World Clock</h1>
          <p className="text-xs text-muted-foreground">{formatDate(now)}</p>
        </div>
      </div>

      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border
                   bg-background/50 backdrop-blur-sm transition-colors hover:bg-accent"
        aria-label="Toggle theme"
      >
        {theme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </button>
    </header>
  );
}
