"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { ALL_TIMEZONES } from "@/data/timezone-data";
import { formatTime } from "@/lib/timezone-utils";
import { getFlagForTimezone } from "@/lib/timezone-flags";
import { Search, X } from "lucide-react";

interface QuickSearchProps {
  now: Date;
  isActive: (tz: string) => boolean;
  onToggle: (tz: string) => void;
  onClose: () => void;
  is24h?: boolean;
}

export function QuickSearch({ now, isActive, onToggle, onClose, is24h }: QuickSearchProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) {
      // Show currently active timezones when no query
      return ALL_TIMEZONES.filter((tz) => isActive(tz.timezone)).slice(0, 10);
    }
    return ALL_TIMEZONES.filter(
      (tz) =>
        tz.label.toLowerCase().includes(q) ||
        tz.timezone.toLowerCase().includes(q) ||
        tz.continent.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [search, isActive]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const selected = list.children[selectedIndex] as HTMLElement;
    if (selected) {
      selected.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        onToggle(results[selectedIndex].timezone);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [results, selectedIndex, onToggle, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-x-0 top-[15%] z-50 mx-auto w-[90%] max-w-md rounded-xl border border-border bg-popover shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search timezones..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            onClick={onClose}
            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[300px] overflow-y-auto py-1">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No timezones found
            </div>
          ) : (
            results.map((tz, index) => {
              const active = isActive(tz.timezone);
              return (
                <button
                  key={tz.timezone}
                  onClick={() => onToggle(tz.timezone)}
                  className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors
                    ${index === selectedIndex ? "bg-accent" : "hover:bg-accent/50"}
                    ${active ? "opacity-100" : "opacity-60"}`}
                >
                  <span className="text-base leading-none shrink-0">{getFlagForTimezone(tz.timezone)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{tz.label}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{tz.continent} · {tz.timezone}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono tabular-nums" suppressHydrationWarning>
                      {formatTime(tz.timezone, now, is24h)}
                    </div>
                  </div>
                  <div className={`h-2 w-2 rounded-full shrink-0 ${active ? "bg-emerald-400" : "bg-muted-foreground/20"}`} />
                </button>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-border px-4 py-2 text-[10px] text-muted-foreground flex items-center gap-3">
          <span><kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[9px]">↑↓</kbd> navigate</span>
          <span><kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[9px]">↵</kbd> toggle</span>
          <span><kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[9px]">esc</kbd> close</span>
        </div>
      </div>
    </>
  );
}
