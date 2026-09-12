/** Ladekurve → Ladezeit: avgKw 10–80 and temp factors (no marketing peak as time). */

import type { Car } from "./types";

export type KwSpan = { low: number; mid: number; high: number };

/**
 * Catalog avg kW over 10->80 % SoC at ~20 °C (Ladekurve handoff).
 *
 * UNVERIFIED against manufacturer figures. These drive the single number a
 * reader is most likely to check against their own experience, so they are the
 * most damaging place to be wrong.
 *
 * Known discrepancy, 12.09.2026: for `skoda-elroq` (77 kWh usable, 175 kW peak)
 * this table's mid of 100 kW yields 36 minutes for 10->80 %, but published
 * figures for the MEB 77 kWh platform are commonly around 28 minutes, which
 * implies roughly 115 kW average - this table's `high`, not its `mid`. If that
 * holds, several mids here are conservative and every trip plan overstates the
 * time at the charger.
 *
 * Do not "fix" these from memory. Check 10->80 % times against the
 * manufacturer or a measured test, then derive avg kW as
 * (usableKwh * 0.7) / (minutes / 60), and record the source.
 */
const AVG_KW_10_80: Record<string, KwSpan> = {
  "vw-id7": { low: 110, mid: 125, high: 145 },
  "tesla-m3": { low: 75, mid: 105, high: 120 },
  "tesla-my": { low: 90, mid: 110, high: 125 },
  "byd-seal": { low: 90, mid: 103, high: 115 },
  "hyundai-ioniq5": { low: 150, mid: 175, high: 190 },
  "vw-id3": { low: 85, mid: 95, high: 110 },
  "skoda-elroq": { low: 90, mid: 100, high: 115 },
  "kia-ev3": { low: 70, mid: 80, high: 95 },
  "bmw-ix1": { low: 70, mid: 80, high: 95 },
  "renault-5": { low: 50, mid: 58, high: 70 },
  "cupra-born": { low: 70, mid: 80, high: 95 },
  "volvo-ex30": { low: 75, mid: 90, high: 105 },
  "byd-dolphin": { low: 45, mid: 55, high: 65 },
  "opel-corsa": { low: 50, mid: 58, high: 70 },
  "mercedes-eqa": { low: 70, mid: 80, high: 95 },
};

const FALLBACK_TYPICAL = 0.55;
const FALLBACK_LOW = 0.45;
const FALLBACK_HIGH = 0.65;

export function avgKwSpanForCar(car: Car): KwSpan {
  const hit = AVG_KW_10_80[car.id];
  if (hit) return hit;
  const peak = Math.max(1, car.dcPeakKw);
  return {
    low: Math.round(peak * FALLBACK_LOW),
    mid: Math.round(peak * FALLBACK_TYPICAL),
    high: Math.round(peak * FALLBACK_HIGH),
  };
}

function lerp(x: number, x0: number, y0: number, x1: number, y1: number): number {
  if (x1 === x0) return y0;
  const t = (x - x0) / (x1 - x0);
  return y0 + t * (y1 - y0);
}

/**
 * Factor on avgKw_10_80 from outdoor °C (Ladekurve mid table).
 * Default preconditioned=true (trip planner / Navi stop assumed).
 */
export function tempFactorCharge(
  outdoorC: number,
  preconditioned = true,
): number {
  // Breakpoints: [°C, with, without]
  const pts: [number, number, number][] = [
    [-7, 0.85, 0.575],
    [0, 0.9, 0.65],
    [10, 0.97, 0.9],
    [20, 1.0, 1.0],
    [30, 0.95, 0.9],
  ];
  const col = preconditioned ? 1 : 2;
  if (outdoorC <= pts[0]![0]) return pts[0]![col]!;
  if (outdoorC >= pts[pts.length - 1]![0]) return pts[pts.length - 1]![col]!;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    if (outdoorC <= b[0]) {
      return lerp(outdoorC, a[0], a[col]!, b[0], b[col]!);
    }
  }
  return 1;
}

export const OVERHEAD_MIN = 8;
export const STOP_ENERGY_FRAC = 0.7;
