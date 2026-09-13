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
 * Extended 12.09.2026 while checking backlog #12/#13 - the same conservatism
 * is confirmed on one more entry and suspected, unconfirmed, on several others:
 *
 * - `kia-ev3` (78.1 kWh usable, 128 kW peak): this table's mid of 80 kW yields
 *   ~41 min for 10->80 %, but Kia's own published figure for the 81.4 kWh Long
 *   Range pack is ~29-31 min, implying ~106-109 kW average (83-85 % of peak,
 *   not 63 %). CONFIRMED conservative - sourced against Kia's spec sheet and
 *   independent charging-time calculators, 12.09.2026.
 * - `byd-seal` was checked too and is NOT conservative: independent sources put
 *   its 10->80 % at 35-37 min, in line with (if anything slightly faster than)
 *   this table's mid of 103 kW / ~34 min. Do not "fix" it.
 * - `bmw-ix1`, `cupra-born`, `renault-5`, `opel-corsa`, `byd-dolphin` sit at the
 *   same 57-63 % of peak as the two confirmed-conservative entries above
 *   (`skoda-elroq` 57 %, `kia-ev3` 63 %) - suspicious by pattern, but UNCHECKED
 *   against a source. `volvo-ex30` is also unchecked and worth a second look in
 *   the other direction: at 59 % of peak it is not out of line with the rest of
 *   the table, but has not been verified either.
 * - The 57-63 % clustering across most of the table's non-confirmed entries is
 *   itself suspicious: it sits close to the untouched-car FALLBACK_TYPICAL
 *   ratio below (0.55) rather than looking like a per-car sourced figure, which
 *   is consistent with most of this table never having been checked against a
 *   manufacturer number in the first place - only `hyundai-ioniq5` (75 %) and
 *   `byd-seal` (69 %) stand out as plausibly real per-car data.
 *
 * Extended again 13.09.2026 for the 15-car catalog expansion (data/cars.de.json).
 * Of those 15 new cars, six got an explicit entry below and nine were left on
 * the plain peak-based fallback because there was no specific figure to reason
 * from - guessing a number would only add another unsourced entry to the
 * cluster above, which is the opposite of the point. The six added:
 *
 * - `vw-id-buzz` (79 kWh usable, 170 kW peak): interpolated from its own MEB
 *   siblings already in this table (`vw-id3` 56 % of peak, `vw-id7` 62.5 %),
 *   not from a Buzz-specific source - mid = 100 kW, 59 % of peak.
 * - `audi-q6-etron` (94.9 kWh usable, 270 kW peak) and `kia-ev6` (74 kWh
 *   usable, 239 kW peak): both are 800V platforms (PPE / E-GMP) reasoned by
 *   analogy to `hyundai-ioniq5` (also E-GMP-family, 75 % of peak, flagged
 *   above as plausibly real) rather than the low-power `kia-ev3` in this same
 *   table, which is a different pack/inverter and already confirmed
 *   conservative - mid = 200 kW (74 %) and 170 kW (71 %) respectively.
 * - `polestar-2` (79 kWh usable, 205 kW peak): back-derived from a commonly
 *   cited ~28 min 10->80 % figure for this pack, giving avg kW = (0.7*79)/(28/60)
 *   ~= 118 kW, 58 % of peak - close to the FALLBACK_TYPICAL ratio, but recorded
 *   explicitly rather than left to fall through, since a reason exists.
 * - `mercedes-eqs` (107.8 kWh usable, 200 kW peak): back-derived the same way
 *   from a commonly cited ~31 min 10->80 % figure, giving avg kW ~= 146 kW,
 *   73 % of peak - in the same "genuinely fast, well-engineered flagship"
 *   range as `hyundai-ioniq5` and `byd-seal` above.
 * - `toyota-bz4x` (71.4 kWh usable, 150 kW peak): the one deliberately
 *   *below* FALLBACK_TYPICAL, not above it. The bZ4X has a widely reported
 *   reputation (independent reviews, forum consensus - not a timed source) for
 *   a flatter, more conservative DC curve than its peak spec implies; mid =
 *   68 kW, 45 % of peak (matching FALLBACK_LOW's ratio, not FALLBACK_TYPICAL's).
 *   This is a reasoned pessimistic estimate, explicitly not a source - if
 *   this car's charge time is ever challenged, this line is where to look.
 *
 * None of this touches the two confirmed-conservative entries (`skoda-elroq`,
 * `kia-ev3`) or the five-plus-one suspected-but-unchecked ones from the
 * 12.09.2026 pass - that problem is exactly as big as it was, not bigger.
 *
 * Do not "fix" these from memory. Check 10->80 % times against the
 * manufacturer or a measured test, then derive avg kW as
 * (usableKwh * 0.7) / (minutes / 60), and record the source.
 */
const AVG_KW_10_80: Record<string, KwSpan> = {
  "vw-id7": { low: 110, mid: 125, high: 145 },
  // Same MEB 77 kWh pack and 175 kW peak as the ID.7 saloon; the estate
  // body changes drag, not the charging curve. UNVERIFIED like its sibling.
  "vw-id7-tourer": { low: 110, mid: 125, high: 145 },
  // peugeot-e308-sw and opel-astra-st are left on the peak-based fallback
  // on purpose: same Stellantis 51 kWh platform, and there is no informed
  // basis here to claim a better figure than 0.55 x peak.
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
  "vw-id-buzz": { low: 85, mid: 100, high: 120 },
  "audi-q6-etron": { low: 170, mid: 200, high: 230 },
  "kia-ev6": { low: 145, mid: 170, high: 195 },
  "polestar-2": { low: 100, mid: 118, high: 135 },
  "mercedes-eqs": { low: 125, mid: 146, high: 165 },
  "toyota-bz4x": { low: 55, mid: 68, high: 85 },
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

/**
 * Minutes to take a pack from 10 to 80 %, as a span.
 *
 * This is the figure `ladekurve-lock.md` says belongs in front of a reader:
 * "Unterwegs zählt, wie schnell das Auto von etwa 10 auf 80 Prozent nachlädt,
 * nicht die große Peak-Zahl auf dem Datenblatt", and `dcPeakKw` is marked there
 * as "nur Referenz, nie Zeitbasis". A flat curve with a lower peak can finish
 * sooner than a peaky one with a higher peak, so a reader comparing cars by
 * peak alone draws exactly the wrong conclusion.
 *
 * Charging only. The eight minutes of pulling in, plugging and paying belong to
 * a stop, not to the battery, and are added in the trip planner instead.
 */
export function charge1080Min(
  car: Car,
  outdoorC = 20,
  preconditioned = true,
): { low: number; mid: number; high: number } {
  const kw = avgKwSpanForCar(car);
  const f = tempFactorCharge(outdoorC, preconditioned);
  const energy = car.usableKwh * STOP_ENERGY_FRAC;
  const minutes = (avgKw: number) => (energy / Math.max(1, avgKw * f)) * 60;
  /* Faster average means fewer minutes, so the spans invert. */
  return {
    low: Math.round(minutes(kw.high)),
    mid: Math.round(minutes(kw.mid)),
    high: Math.round(minutes(kw.low)),
  };
}

export const OVERHEAD_MIN = 8;
export const STOP_ENERGY_FRAC = 0.7;
