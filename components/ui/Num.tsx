import type { ReactNode } from "react";

/**
 * Numerals, German, and locked to one digit width.
 *
 * Everything numeric on this site ends up in a column that someone compares
 * downwards — prices, kilometres, minutes. Proportional digits make that
 * comparison lie by a few pixels, so every figure rendered through here carries
 * `.tnum` (tabular figures, defined in globals.css).
 *
 * These are formatting helpers, not engine helpers: they take numbers and
 * return strings. Nothing here knows what a car is.
 */

/** Thin non-breaking space is wrong for German units; use NBSP, as DIN 5008 has it. */
const NBSP = " ";
const ENDASH = "–";

export function formatDe(value: number, decimals = 0): string {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** `formatDeUnit(432, "km")` → `432 km` (with a non-breaking space). */
export function formatDeUnit(value: number, unit?: string, decimals = 0): string {
  const n = formatDe(value, decimals);
  return unit ? `${n}${NBSP}${unit}` : n;
}

/**
 * `formatDeSpan(432, 540, { unit: "km" })` → `432–540 km`.
 * The unit is printed once, after the pair — never after each figure.
 * A collapsed span (low === high) prints as a single figure, not as `x–x`.
 */
export function formatDeSpan(
  low: number,
  high: number,
  opts: { unit?: string; decimals?: number } = {},
): string {
  const { unit, decimals = 0 } = opts;
  const lo = Math.min(low, high);
  const hi = Math.max(low, high);
  const a = formatDe(lo, decimals);
  const b = formatDe(hi, decimals);
  const body = a === b ? a : `${a}${ENDASH}${b}`;
  return unit ? `${body}${NBSP}${unit}` : body;
}

/** One figure with locked digit width. */
export function Num({
  value,
  unit,
  decimals = 0,
  className = "",
}: {
  value: number;
  /** Printed after the figure. Leave it off inside a group that labels its unit once. */
  unit?: string;
  decimals?: number;
  className?: string;
}): ReactNode {
  return <span className={`tnum ${className}`}>{formatDeUnit(value, unit, decimals)}</span>;
}

/** A low–high pair with locked digit width. */
export function NumSpan({
  low,
  high,
  unit,
  decimals = 0,
  className = "",
}: {
  low: number;
  high: number;
  unit?: string;
  decimals?: number;
  className?: string;
}): ReactNode {
  return (
    <span className={`tnum ${className}`}>{formatDeSpan(low, high, { unit, decimals })}</span>
  );
}
