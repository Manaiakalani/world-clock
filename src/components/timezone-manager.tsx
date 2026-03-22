"use client";

import { useState, useMemo } from "react";
import { ALL_TIMEZONES, CONTINENTS } from "@/data/timezone-data";
import { formatTime, getOffsetFromLocal, formatOffset } from "@/lib/timezone-utils";
import { getFlagForTimezone } from "@/lib/timezone-flags";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search } from "lucide-react";

const TIMEZONE_PRESETS: Record<string, string[]> = {
  Americas: ["America/Los_Angeles", "America/New_York", "America/Chicago", "America/Sao_Paulo"],
  Europe: ["Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Istanbul"],
  APAC: ["Asia/Tokyo", "Asia/Shanghai", "Asia/Calcutta", "Australia/Sydney"],
  Africa: ["Africa/Nairobi", "Africa/Lagos", "Africa/Cairo", "Africa/Johannesburg"],
};

interface TimezoneManagerProps {
  now: Date;
  isActive: (tz: string) => boolean;
  onToggle: (tz: string) => void;
  onSetTimezones: (tzs: string[]) => void;
  onClose: () => void;
  is24h?: boolean;
}

export function TimezoneManager({
  now,
  isActive,
  onToggle,
  onSetTimezones,
  onClose,
  is24h,
}: TimezoneManagerProps) {
  const [search, setSearch] = useState("");
  const [expandedContinent, setExpandedContinent] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return ALL_TIMEZONES;
    return ALL_TIMEZONES.filter(
      (tz) =>
        tz.label.toLowerCase().includes(q) ||
        tz.timezone.toLowerCase().includes(q) ||
        tz.continent.toLowerCase().includes(q)
    );
  }, [search]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const continent of CONTINENTS) {
      const items = filtered.filter((tz) => tz.continent === continent);
      if (items.length > 0) map.set(continent, items);
    }
    return map;
  }, [filtered]);

  const activeCount = ALL_TIMEZONES.filter((tz) => isActive(tz.timezone)).length;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 pb-3">
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border
                     bg-background/50 transition-colors hover:bg-accent"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h2 className="text-base font-semibold tracking-tight">Manage Timezones</h2>
          <p className="text-[11px] text-muted-foreground">{activeCount} active</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative shrink-0 pb-3">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search timezones..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm bg-background/50"
        />
      </div>

      {/* Preset groups */}
      <div className="flex shrink-0 flex-wrap gap-2 pb-3">
        {Object.entries(TIMEZONE_PRESETS).map(([label, tzs]) => (
          <button
            key={label}
            onClick={() => {
              const current = ALL_TIMEZONES.filter((tz) => isActive(tz.timezone)).map(
                (tz) => tz.timezone
              );
              const merged = Array.from(new Set([...current, ...tzs]));
              onSetTimezones(merged);
            }}
            className="rounded-full bg-accent/50 px-3 py-1 text-xs transition-colors hover:bg-accent"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Timezone list grouped by continent */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {Array.from(grouped.entries()).map(([continent, timezones]) => {
          const isExpanded = expandedContinent === continent || search.length > 0;
          const activeInGroup = timezones.filter((tz) => isActive(tz.timezone)).length;

          return (
            <div key={continent} className="mb-1">
              <button
                onClick={() =>
                  setExpandedContinent(isExpanded && !search ? null : continent)
                }
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5
                           text-xs font-semibold uppercase tracking-wider text-muted-foreground
                           transition-colors hover:bg-accent/50"
              >
                <span>{continent}</span>
                <span className="text-[10px] font-normal tabular-nums">
                  {activeInGroup}/{timezones.length}
                </span>
              </button>

              {isExpanded && (
                <div className="flex flex-col gap-0.5 pb-2">
                  {timezones.map((tz) => {
                    const offset = getOffsetFromLocal(tz.timezone, now);
                    const time = formatTime(tz.timezone, now, is24h);
                    const active = isActive(tz.timezone);

                    return (
                      <label
                        key={tz.timezone}
                        className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5
                                    transition-colors hover:bg-accent/50
                                    ${active ? "bg-accent/30" : ""}`}
                      >
                        <Switch
                          checked={active}
                          onCheckedChange={() => onToggle(tz.timezone)}
                          className="scale-75"
                        />
                        <span className="text-base leading-none shrink-0">
                          {getFlagForTimezone(tz.timezone)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{tz.label}</div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {tz.timezone}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-mono tabular-nums" suppressHydrationWarning>
                            {time}
                          </div>
                          <div className="text-[10px] text-muted-foreground" suppressHydrationWarning>
                            {formatOffset(offset)}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
