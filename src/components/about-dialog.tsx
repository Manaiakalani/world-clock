"use client";

import { X, Github, Keyboard, Shield } from "lucide-react";

interface AboutDialogProps {
  onClose: () => void;
}

export function AboutDialog({ onClose }: AboutDialogProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-x-0 top-[10%] z-50 mx-auto w-[90%] max-w-md rounded-xl border border-border bg-popover shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">World Clock</h2>
            <p className="text-[11px] text-muted-foreground">Global Timezone Tracker</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-accent transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto">
          {/* About */}
          <div className="px-5 py-4 border-b border-border">
            <p className="text-sm text-muted-foreground leading-relaxed">
              A beautiful world clock to track teammates across the globe.
              Features an interactive 3D globe, real-time weather data, sky-gradient
              backgrounds, and a meeting planner for finding overlapping work hours.
            </p>
          </div>

          {/* Keyboard shortcuts */}
          <div className="px-5 py-4 border-b border-border">
            <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
              <Keyboard className="h-4 w-4 text-muted-foreground" />
              Keyboard Shortcuts
            </h3>
            <div className="space-y-2 text-sm">
              {[
                ["⌘K", "Quick search"],
                ["⌘,", "Manage timezones"],
                ["⌘M", "Meeting planner"],
                ["Esc", "Close panel"],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{desc}</span>
                  <kbd className="rounded border border-border bg-muted px-2 py-0.5 text-[11px] font-mono">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy */}
          <div className="px-5 py-4 border-b border-border">
            <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Privacy
            </h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li>• All data stored locally in your browser</li>
              <li>• No user accounts or tracking</li>
              <li>• Weather data from <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground transition-colors">Open-Meteo</a> (free, no API key)</li>
              <li>• No cookies or analytics</li>
              <li>• Open source — inspect the code yourself</li>
            </ul>
          </div>

          {/* Links */}
          <div className="px-5 py-4">
            <a
              href="https://github.com/Manaiakalani/world-clock"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                         transition-colors hover:bg-accent"
            >
              <Github className="h-5 w-5" />
              <div>
                <div>View on GitHub</div>
                <div className="text-[11px] text-muted-foreground">Star the project, report issues, contribute</div>
              </div>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-3 text-center text-[10px] text-muted-foreground">
          Built with Next.js, COBE, shadcn/ui, and Open-Meteo
        </div>
      </div>
    </>
  );
}
