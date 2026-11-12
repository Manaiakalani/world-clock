"use client";

import { useEffect, useRef, useState } from "react";
import {
  Calendar,
  Check,
  Clock,
  Info,
  Link2,
  List,
  MoreHorizontal,
  Search,
  Settings2,
  Moon,
  Sun,
} from "lucide-react";

interface MobileActionBarProps {
  is24h: boolean;
  showClock: boolean;
  customOrder: boolean;
  copied: boolean;
  dark: boolean;
  onSearch: () => void;
  onManage: () => void;
  onPlan: () => void;
  onToggleTheme: () => void;
  onToggleTimeFormat: () => void;
  onToggleClock: () => void;
  onShare: () => void;
  onToggleCustomOrder: () => void;
  onAbout: () => void;
}

const PRESS =
  "flex h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] text-muted-foreground active:scale-[0.95] active:bg-accent/50 transition-transform duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)]";

/**
 * Phone and tablet actions. The header icon row only fits at `xl`; below that
 * this bar is the primary control surface, so every item is a 44px target and
 * the bar itself clears the home indicator.
 */
export function MobileActionBar({
  is24h,
  showClock,
  customOrder,
  copied,
  dark,
  onSearch,
  onManage,
  onPlan,
  onToggleTheme,
  onToggleTimeFormat,
  onToggleClock,
  onShare,
  onToggleCustomOrder,
  onAbout,
}: MobileActionBarProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    menuRef.current?.querySelector("button")?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <nav
      aria-label="Primary actions"
      className="xl:hidden fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/85
                 pb-[env(safe-area-inset-bottom)]
                 pl-[max(0.5rem,env(safe-area-inset-left))]
                 pr-[max(0.5rem,env(safe-area-inset-right))]"
    >
      <div className="flex items-center justify-around px-1 py-1.5">
        <button type="button" onClick={onSearch} className={PRESS} aria-label="Quick search">
          <Search className="h-5 w-5" />
          <span className="leading-none">Search</span>
        </button>
        <button type="button" onClick={onManage} className={PRESS} aria-label="Manage timezones">
          <Settings2 className="h-5 w-5" />
          <span className="leading-none">Manage</span>
        </button>
        <button type="button" onClick={onPlan} className={PRESS} aria-label="Meeting planner">
          <Calendar className="h-5 w-5" />
          <span className="leading-none">Plan</span>
        </button>
        <button type="button" onClick={onToggleTheme} className={PRESS} aria-label="Toggle theme">
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span className="leading-none">Theme</span>
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label="More actions"
          className={PRESS}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="leading-none">More</span>
        </button>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <div
            ref={menuRef}
            role="menu"
            className="overflow-menu-enter absolute bottom-[calc(100%+8px)] z-20 w-48 rounded-xl border border-border
                       bg-popover/95 shadow-lg overflow-hidden
                       right-[max(0.5rem,env(safe-area-inset-right))]"
            style={{ transformOrigin: "bottom right" }}
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onToggleTimeFormat();
                setOpen(false);
              }}
              className="flex min-h-11 w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-accent active:bg-accent"
            >
              <span>Time format</span>
              <span className="font-mono text-xs font-bold text-muted-foreground">{is24h ? "24h" : "12h"}</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onToggleClock();
                setOpen(false);
              }}
              className="flex min-h-11 w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-accent active:bg-accent"
            >
              <span>{showClock ? "Hide clock" : "Show clock"}</span>
              {showClock ? <Clock className="h-4 w-4 text-muted-foreground" /> : <List className="h-4 w-4 text-muted-foreground" />}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onShare();
                setOpen(false);
              }}
              className="flex min-h-11 w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-accent active:bg-accent"
            >
              <span>Share link</span>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Link2 className="h-4 w-4 text-muted-foreground" />}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onToggleCustomOrder();
                setOpen(false);
              }}
              className="flex min-h-11 w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-accent active:bg-accent"
            >
              <span>{customOrder ? "Sort by time" : "Custom order"}</span>
              <span className="text-[10px] font-medium text-muted-foreground">{customOrder ? "drag" : "UTC"}</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onAbout();
                setOpen(false);
              }}
              className="flex min-h-11 w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-accent active:bg-accent"
            >
              <span>About</span>
              <Info className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </>
      )}
    </nav>
  );
}
