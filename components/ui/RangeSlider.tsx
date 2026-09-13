"use client";

import { useId } from "react";

/**
 * One range, two handles.
 *
 * Under the hood these are two ordinary `<input type="range">` elements lying on
 * the same track, not a widget built from divs and mouse events. Each handle
 * therefore keeps arrow-key stepping, Home/End, focus, and the announcement a
 * screen reader gives a slider — none of which a hand-rolled version gets back
 * for free. The styling that makes them read as a single control lives in
 * `globals.css` under `.rangepair`.
 *
 * Either end may be open: pass `null` and the handle parks at its stop, which
 * means "no limit on this side" rather than "exactly this much". Without that,
 * a reader who once set an upper limit could never take it off again.
 *
 * Handles may be dragged past each other. The value pair is reported in the
 * order the handles sit, so a caller never has to deal with an inverted range.
 */

type Props = {
  min: number;
  max: number;
  step?: number;
  /** null = open at the bottom */
  valueMin: number | null;
  /** null = open at the top */
  valueMax: number | null;
  onChange: (next: { min: number | null; max: number | null }) => void;
  /** Names the pair for assistive tech, e.g. "Kaufpreis". */
  label: string;
  /** Turns a raw number into its spoken form, e.g. "30.000 €". */
  format: (n: number) => string;
  className?: string;
};

export function RangeSlider({
  min,
  max,
  step = 1,
  valueMin,
  valueMax,
  onChange,
  label,
  format,
  className = "",
}: Props) {
  const id = useId();
  const lo = valueMin ?? min;
  const hi = valueMax ?? max;

  const span = Math.max(1, max - min);
  const leftPct = ((lo - min) / span) * 100;
  const rightPct = ((hi - min) / span) * 100;

  /* Sitting on a stop means "open", not "exactly the stop value". */
  const asMin = (v: number) => (v <= min ? null : v);
  const asMax = (v: number) => (v >= max ? null : v);

  return (
    <div className={`rangepair ${className}`}>
      <div className="rangepair-track" />
      <div
        className="rangepair-fill"
        style={{ left: `${Math.min(leftPct, rightPct)}%`, right: `${100 - Math.max(leftPct, rightPct)}%` }}
      />

      <input
        type="range"
        id={`${id}-lo`}
        min={min}
        max={max}
        step={step}
        value={lo}
        aria-label={`${label}, untere Grenze`}
        aria-valuetext={valueMin === null ? "offen nach unten" : format(lo)}
        onChange={(e) => {
          const v = Number(e.target.value);
          /* Dragged past the other handle: report the pair in sorted order
             rather than clamping, so the handle follows the finger. */
          if (v > hi) onChange({ min: asMin(hi), max: asMax(v) });
          else onChange({ min: asMin(v), max: valueMax });
        }}
      />

      <input
        type="range"
        id={`${id}-hi`}
        min={min}
        max={max}
        step={step}
        value={hi}
        aria-label={`${label}, obere Grenze`}
        aria-valuetext={valueMax === null ? "offen nach oben" : format(hi)}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (v < lo) onChange({ min: asMin(v), max: asMax(lo) });
          else onChange({ min: valueMin, max: asMax(v) });
        }}
      />
    </div>
  );
}
