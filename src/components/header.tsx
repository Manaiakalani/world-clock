"use client";

import { formatDate } from "@/lib/timezone-utils";
interface HeaderProps {
  now: Date;
}

export function Header({ now }: HeaderProps) {
  return (
    <header className="flex shrink-0 items-center justify-between px-4 py-2 sm:px-6 sm:py-3">
      <div className="flex items-center gap-3">
        <div className="group flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 border border-white/10 backdrop-blur-sm shadow-sm cursor-default transition-transform duration-300 hover:scale-110">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5 text-primary"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Globe circle */}
            <circle cx="12" cy="12" r="9.5" className="globe-anim animate-[globe-pulse_4s_ease-in-out_infinite]" />
            {/* Meridian lines */}
            <ellipse cx="12" cy="12" rx="4" ry="9.5" className="globe-anim animate-[globe-spin_8s_linear_infinite]" />
            <ellipse cx="12" cy="12" rx="7" ry="9.5" className="globe-anim animate-[globe-spin_8s_linear_infinite_reverse]" style={{ animationDelay: "-2s" }} />
            {/* Latitude lines */}
            <path d="M3 12h18" />
            <path d="M4.5 7.5h15" opacity="0.5" />
            <path d="M4.5 16.5h15" opacity="0.5" />
            {/* Orbiting dot */}
            <circle r="1.2" fill="currentColor" stroke="none" className="globe-anim animate-[globe-orbit_3s_cubic-bezier(0.37,0,0.63,1)_infinite]" />
          </svg>
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight leading-tight">World Clock</h1>
          <p className="text-[10px] font-medium text-muted-foreground tracking-wide uppercase">{formatDate(now)}</p>
        </div>
      </div>

    </header>
  );
}
