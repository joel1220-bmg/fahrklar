import type { CSSProperties } from "react";
import { formatDeSpan, formatDeUnit } from "./Num";

/**
 * The result screen's whole claim is that a range is honest information, not
 * a hedge. Printed as text ("366–457 km") a span carries no sense of width —
 * a 90 km span and a 9 km span read identically. Drawn on a shared track,
 * they don't.
 *
 * Purely presentational: numbers in, geometry and pixels out. This file must
 * never import from lib/engine — it has no idea what a car or a trip is, and
 * it should stay that way.
 */

/**
 * A domain shared by every bar in a column. Compute it once from the whole
 * dataset and pass the same object to every `RangeBar` — a bar that picked
 * its own min/max from just its own low/high would make every row look
 * equally wide, which is exactly the lie this primitive exists to prevent.
 */
export type RangeBarScale = { min: number; max: number };

/**
 * Convenience constructor for a shared scale: fits every value passed in,
 * optionally padded by a fraction of the resulting span on each side (e.g.
 * `pad: 0.05` leaves 5 % of breathing room past the extreme bars).
 */
export function rangeScaleFrom(values: number[], pad = 0): RangeBarScale {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return { min: 0, max: 1 };
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  if (min === max) {
    // A single repeated value (or one row) still needs a domain wider than
    // one point, or every bar would draw as a single pixel at 0 %/100 %.
    const half = (Math.abs(min) || 1) * 0.1;
    return { min: min - half, max: max + half };
  }
  const span = max - min;
  return { min: min - span * pad, max: max + span * pad };
}

export type RangeBarLayout = {
  /** Left edge of the [low, high] span, 0–100. */
  startPct: number;
  /** Width of the [low, high] span, 0–100. */
  widthPct: number;
  /** Position of `mid` on the same 0–100 track, or null if not given. */
  midPct: number | null;
  /** Position of `mark` on the same 0–100 track, or null if not given. */
  markPct: number | null;
};

function clampPct(v: number): number {
  return Math.min(100, Math.max(0, v));
}

/**
 * Pure geometry: where the span, the mid tick and the reference marker land
 * on a 0–100 track for a given shared scale. Exported so placement can be
 * tested without rendering anything.
 */
export function rangeBarLayout(
  low: number,
  high: number,
  scale: RangeBarScale,
  mid?: number,
  mark?: number,
): RangeBarLayout {
  const domain = scale.max - scale.min || 1e-9;
  const toPct = (v: number) => clampPct(((v - scale.min) / domain) * 100);
  const lo = Math.min(low, high);
  const hi = Math.max(low, high);
  const startPct = toPct(lo);
  const endPct = toPct(hi);
  return {
    startPct,
    widthPct: Math.max(endPct - startPct, 0),
    midPct: mid != null ? toPct(mid) : null,
    markPct: mark != null ? toPct(mark) : null,
  };
}

/**
 * The sentence a screen reader announces in place of the graphic. Built from
 * `Num`'s own formatting rules (German grouping, en-dash span, unit once) —
 * this is number formatting, not new product copy. Pass `ariaLabel` on the
 * component to replace it outright with copy-guard-approved wording instead.
 */
export function rangeBarLabel(opts: {
  low: number;
  high: number;
  mid?: number;
  mark?: number;
  unit?: string;
  decimals?: number;
  /** Spoken before the span, e.g. "Autobahn-Reichweite". */
  prefix?: string;
  /** What `mark` represents, e.g. "WLTP". Defaults to "Referenzwert". */
  markLabel?: string;
}): string {
  const { low, high, mid, mark, unit, decimals = 0, prefix, markLabel } = opts;
  const span = formatDeSpan(low, high, { unit, decimals });
  const clauses = [[prefix, span].filter(Boolean).join(": ")];
  if (mid != null) clauses.push(`üblich ${formatDeUnit(mid, unit, decimals)}`);
  if (mark != null) {
    clauses.push(`${markLabel ?? "Referenzwert"} ${formatDeUnit(mark, unit, decimals)}`);
  }
  return clauses.join(", ");
}

export function RangeBar({
  low,
  high,
  mid,
  mark,
  markLabel,
  scale,
  unit,
  decimals = 0,
  prefix,
  ariaLabel,
  className = "",
}: {
  low: number;
  high: number;
  /** The value this app itself would quote as the typical figure. */
  mid?: number;
  /** An external, already-fixed figure to compare against (e.g. WLTP),
   *  drawn as a small caret above the track — distinct from the mid tick. */
  mark?: number;
  /** What `mark` represents, folded into the accessible label. Ignored if
   *  `mark` is not given. */
  markLabel?: string;
  /** Shared across every bar in the column — build once with `rangeScaleFrom`. */
  scale: RangeBarScale;
  /** Unit for the accessible label only; nothing is drawn as text. */
  unit?: string;
  decimals?: number;
  prefix?: string;
  /** Full override of the computed accessible label. */
  ariaLabel?: string;
  className?: string;
}) {
  const { startPct, widthPct, midPct, markPct } = rangeBarLayout(low, high, scale, mid, mark);
  const label =
    ariaLabel ?? rangeBarLabel({ low, high, mid, mark, unit, decimals, prefix, markLabel });

  const spanStyle: CSSProperties = {
    left: `${startPct}%`,
    width: `${widthPct}%`,
    background: "var(--color-data-range-soft)",
    borderColor: "var(--color-data-range)",
  };

  return (
    <div
      role="img"
      aria-label={label}
      className={`relative h-2 w-full rounded-full border border-line ${className}`}
      style={{ background: "var(--color-data-track)" }}
    >
      {/* The span: a soft fill with a solid edge at each boundary. The fill
          alone (data-range-soft on data-track) does not clear 3:1 — see the
          note by the token definitions in globals.css — so the boundary is
          carried by the border instead, per the WCAG 1.4.11 technique for
          graphical objects whose fill can't. */}
      <div aria-hidden="true" className="absolute inset-y-0 rounded-full border-x-2" style={spanStyle} />

      {midPct != null ? (
        <div
          aria-hidden="true"
          className="absolute top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ left: `${midPct}%`, background: "var(--color-data-mark)" }}
        />
      ) : null}

      {markPct != null ? (
        <div
          aria-hidden="true"
          className="absolute left-0 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45"
          style={{ left: `${markPct}%`, background: "var(--color-data-mark)" }}
        />
      ) : null}
    </div>
  );
}
