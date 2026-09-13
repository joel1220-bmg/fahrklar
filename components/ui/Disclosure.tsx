"use client";

import { useId, useState, type ReactNode } from "react";

/**
 * A one-line summary that expands to reveal full content, and collapses
 * back down afterward - for anywhere a control's *full* height cannot be
 * allowed to sit on screen permanently, but hiding it outright would be the
 * wrong trade.
 *
 * Built for `ControlBar`'s mobile problem (audit-2026-09-12.md finding B,
 * not this file's own issue to fix - `components/advisor/ControlBar.tsx` is
 * owned by advisor-ux): at 390px its five stacked controls plus the
 * two-slider budget control run to roughly a third of a phone screen, and
 * that whole height lands above the fold, before a single result. The
 * inputs must stay reachable (an smard.de-style tool shows its controls,
 * it doesn't bury them in a drawer) - they just can't cost a third of the
 * screen by default.
 *
 * This component only manages the open/closed boundary and renders two
 * rows. It has no opinion on layout, stickiness, or what "collapsed" should
 * say - pass `summary` as whatever one-line trigger fits the caller (e.g.
 * "Angaben ändern · 2 angenommen"), keep *that* pinned if it needs to be,
 * and let `children` (the full control grid) flow normally beneath it so
 * the permanent footprint is one 44px row instead of the whole set.
 */
export function Disclosure({
  summary,
  children,
  defaultOpen = false,
  open: openProp,
  onOpenChange,
  className = "",
  panelClassName = "",
}: {
  /** Always-visible trigger content. Rendered inside the toggle button, so
   *  keep it plain text/inline elements - no nested interactive controls. */
  summary: ReactNode;
  /** Full content. Only mounted while open, so it costs nothing collapsed. */
  children: ReactNode;
  /** Uncontrolled initial state. Ignored once `open` is supplied. */
  defaultOpen?: boolean;
  /** Controlled open state, e.g. to force it open at a wider breakpoint via
   *  a `matchMedia` hook in the caller. Omit to let this manage its own. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Classes on the outer wrapper. */
  className?: string;
  /** Classes on the expanded content's wrapper. */
  panelClassName?: string;
}) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const open = openProp ?? uncontrolled;
  const panelId = useId();

  const toggle = () => {
    const next = !open;
    onOpenChange?.(next);
    if (openProp === undefined) setUncontrolled(next);
  };

  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
        className="flex min-h-11 w-full items-center justify-between gap-2 text-left text-sm text-ink"
      >
        <span className="min-w-0 truncate">{summary}</span>
        <svg
          aria-hidden
          viewBox="0 0 10 6"
          className={`h-1.5 w-2.5 shrink-0 text-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      {open ? (
        <div id={panelId} className={panelClassName}>
          {children}
        </div>
      ) : (
        // An empty placeholder with the same id while closed, so
        // aria-controls on the trigger above never points at a
        // non-existent element.
        <div id={panelId} hidden />
      )}
    </div>
  );
}
