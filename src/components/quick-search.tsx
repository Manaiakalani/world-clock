"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { ALL_TIMEZONES, type TimezoneEntry } from "@/data/timezone-data";
import { ALL_PLACE_OVERRIDES, resolveTimezone } from "@/data/places";
import { resolveTimezoneQuery } from "@/data/timezone-aliases";
import { formatTime } from "@/lib/timezone-utils";
import { getFlagForTimezone } from "@/lib/timezone-flags";
import { Search, X } from "lucide-react";

interface QuickSearchProps {
  now: Date;
  isActive: (tz: string) => boolean;
  onToggle: (tz: string) => void;
  onClose: () => void;
  is24h?: boolean;
  instant?: boolean;
}

export function QuickSearch({ now, isActive, onToggle, onClose, is24h, instant }: QuickSearchProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // Track the previous results array to reset selection when the list changes
  // without paying for a useEffect → setState cascade. This is React's
  // recommended "adjust state during render" pattern for derived state.
  const [prevResults, setPrevResults] = useState<unknown>(null);

  // Index ALL_TIMEZONES by IANA id for O(1) lookups when resolving aliases
  const tzIndex = useMemo(
    () => new Map(ALL_TIMEZONES.map((tz) => [tz.timezone, tz])),
    []
  );

  interface SearchResult extends TimezoneEntry {
    /** The place id used as the unique key for toggling/storage. Equals tz unless aliased. */
    placeId: string;
    /** Flag override (places carry their own flag). */
    flagOverride?: string;
    aliasHint?: string; // e.g. "via EST"
  }

  // Build a combined entry list once (real timezones + aliased place overrides).
  const allEntries: SearchResult[] = useMemo(() => {
    const base: SearchResult[] = ALL_TIMEZONES.map((tz) => ({
      ...tz,
      placeId: tz.timezone,
    }));
    const places: SearchResult[] = ALL_PLACE_OVERRIDES.map((p) => ({
      timezone: resolveTimezone(p.id),
      label: p.label,
      continent: p.continent,
      coordinates: p.coordinates,
      placeId: p.id,
      flagOverride: p.flag,
    }));
    return [...base, ...places];
  }, []);

  const results: SearchResult[] = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) {
      return allEntries.filter((e) => isActive(e.placeId)).slice(0, 10);
    }

    // Direct name/timezone/continent matching
    const directResults: SearchResult[] = allEntries.filter(
      (e) =>
        e.label.toLowerCase().includes(q) ||
        e.timezone.toLowerCase().includes(q) ||
        e.continent.toLowerCase().includes(q) ||
        e.placeId.toLowerCase().includes(q)
    ).slice(0, 10);

    // If direct matches are sparse, try alias resolution
    if (directResults.length < 3) {
      const aliasMatches = resolveTimezoneQuery(q);
      const seen = new Set(directResults.map((r) => r.placeId));

      for (const match of aliasMatches) {
        if (seen.has(match.timezone)) continue;
        const entry = tzIndex.get(match.timezone);
        if (!entry) continue;
        seen.add(match.timezone);
        directResults.push({ ...entry, placeId: match.timezone, aliasHint: `via ${match.matchedVia}` });
        if (directResults.length >= 10) break;
      }
    }

    return directResults;
  }, [search, isActive, tzIndex, allEntries]);

  if (prevResults !== results) {
    setPrevResults(results);
    setSelectedIndex(0);
  }

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
        onToggle(results[selectedIndex].placeId);
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
        className={`fixed inset-0 z-50 bg-black/55${instant ? " no-animate" : ""}`}
        onClick={onClose}
      />

      {/* Dialog */}
      <div className={`fixed inset-x-0 top-[15%] z-50 mx-auto w-[90%] max-w-md rounded-xl border border-border bg-popover shadow-2xl overflow-hidden${instant ? " no-animate" : ""}`}>
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
              const active = isActive(tz.placeId);
              return (
                <button
                  key={tz.placeId}
                  onClick={() => onToggle(tz.placeId)}
                  className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors
                    ${index === selectedIndex ? "bg-accent" : "hover:bg-accent/50"}
                    ${active ? "opacity-100" : "opacity-60"}`}
                >
                  <span className="text-base leading-none shrink-0">{tz.flagOverride ?? getFlagForTimezone(tz.timezone)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{tz.label}</div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {tz.continent} · {tz.timezone}
                      {tz.aliasHint && (
                        <span className="ml-1 text-muted-foreground/60 italic">{tz.aliasHint}</span>
                      )}
                    </div>
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
