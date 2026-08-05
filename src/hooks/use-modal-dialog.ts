"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Wires up the focus behaviour a modal dialog is expected to have:
 * moves focus into the dialog on open, keeps Tab/Shift+Tab cycling inside it,
 * and returns focus to whatever was focused before it opened.
 *
 * Attach the returned ref to the dialog container.
 */
export function useModalDialog<T extends HTMLElement>(
  onClose: () => void,
  { autoFocus = true }: { autoFocus?: boolean } = {}
) {
  const containerRef = useRef<T>(null);
  // Read onClose through a ref so the effect doesn't re-run (and steal focus
  // again) every time the parent re-creates the callback.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    if (autoFocus) {
      const first = container.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? container).focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        // The page-level window handler also acts on Escape (it closes the time
        // slider and resets the offset). Without this the same keypress would
        // dismiss the dialog *and* discard the user's time travel state.
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey && (active === first || !container.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !container.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      // Only reclaim focus if it's still inside (or was lost to the body) —
      // don't yank it away from wherever the user has since moved.
      const active = document.activeElement;
      if (!active || active === document.body || container.contains(active)) {
        previouslyFocused?.focus?.();
      }
    };
  }, [autoFocus]);

  return containerRef;
}
