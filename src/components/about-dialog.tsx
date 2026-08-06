"use client";

import { useId, useSyncExternalStore } from "react";
import { X, Github, Keyboard, Shield } from "lucide-react";
import { useModalDialog } from "@/hooks/use-modal-dialog";

interface AboutDialogProps {
  onClose: () => void;
  instant?: boolean;
}

// Platform never changes for the life of the page, so there is nothing to
// subscribe to.
const noopSubscribe = () => () => {};

function getModifierKey(): string {
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData
      ?.platform ?? navigator.platform;
  return /mac|iphone|ipad|ipod/i.test(platform ?? "") ? "⌘" : "Ctrl";
}

// The shortcut handlers accept metaKey *or* ctrlKey, so showing ⌘ to everyone
// told Windows and Linux users to press a key their keyboard does not have.
// useSyncExternalStore lets the server render a stable "Ctrl" and swap to the
// real value on the client without a hydration mismatch.
function useModifierKey(): string {
  return useSyncExternalStore(noopSubscribe, getModifierKey, () => "Ctrl");
}

export function AboutDialog({ onClose, instant }: AboutDialogProps) {
  const titleId = useId();
  const dialogRef = useModalDialog<HTMLDivElement>(onClose);
  const mod = useModifierKey();
  const version = process.env.NEXT_PUBLIC_APP_VERSION;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/50${instant ? " no-animate" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`fixed inset-x-0 top-[10%] z-50 mx-auto w-[90%] max-w-md rounded-xl border border-border bg-popover shadow-2xl overflow-hidden${instant ? " no-animate" : ""}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 id={titleId} className="text-base font-semibold">World Clock</h2>
            <p className="text-[11px] text-muted-foreground">Global Timezone Tracker</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-accent transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto">
          {/* About */}
          <div className="px-5 py-4 border-b border-border space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Knowing what time it is for your teammates shouldn&apos;t take mental
              arithmetic. World Clock puts every region on one screen, each card lit by
              its own local sky — so you can tell at a glance who&apos;s mid-morning and
              who&apos;s long asleep.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Spin the globe to find a city, check the live weather before you suggest a
              walk-and-talk, scrub the time slider to look ahead, and let the meeting
              planner surface the hours that actually work for everyone.
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
                [`${mod} K`, "Quick search"],
                [`${mod} ,`, "Manage timezones"],
                [`${mod} M`, "Meeting planner"],
                [`${mod} T`, "Time travel"],
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
              <li>• Your regions and settings never leave your browser</li>
              <li>• No accounts, no sign-in, no server-side profile</li>
              <li>• No cookies, no analytics, no third-party trackers</li>
              <li>• Weather from <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground transition-colors">Open-Meteo</a> — the only network call this app makes</li>
              <li>• MIT licensed and self-hostable — inspect or run it yourself</li>
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
          {version ? `Version ${version} · ` : ""}Built with Next.js, COBE, shadcn/ui, and Open-Meteo
        </div>
      </div>
    </>
  );
}
