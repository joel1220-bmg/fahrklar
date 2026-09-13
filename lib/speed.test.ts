/**
 * The speed axis, end to end, and the sentence printed underneath it.
 *
 * Two separate reasons this file exists.
 *
 * `CLAUDE.md` records the trap: a union grew a variant and the build died,
 * because a zod schema and a clamp function are lists the compiler never
 * checks against the union. `SpeedKph` grew 150 on 13.09.2026, so the chain is
 * walked here rather than remembered, exactly as `bodystyle.test.ts` walks the
 * body styles.
 *
 * The second reason matters more. `COPY.qSpeedHint` is the only advice this
 * site gives that is not a number the reader can check on screen, and until
 * 13.09.2026 it was advice the engine disagreed with. Asserting the claim
 * against the model means the text cannot quietly stop being true when the
 * charging curves or the catalogue move.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COPY } from "./copy";
import { charge1080Min } from "./engine/charge";
import { getCars } from "./engine/evaluate";
import { computeRange, computeTripPlan } from "./engine/range";
import type { SpeedKph } from "./engine/types";
import { emptyDraft } from "./engine/types";
import { draftSchema } from "./schema";

const STEPS: SpeedKph[] = [100, 110, 120, 130, 140, 150];

describe("every speed step is known all the way down", () => {
  it("survives the draft schema", () => {
    for (const s of STEPS) {
      const parsed = draftSchema.safeParse({ ...emptyDraft(), speedKph: s });
      expect(parsed.success, `${s} km/h was rejected by draftSchema`).toBe(true);
    }
  });

  it("rejects a speed outside the axis", () => {
    expect(draftSchema.safeParse({ ...emptyDraft(), speedKph: 160 }).success).toBe(false);
    expect(draftSchema.safeParse({ ...emptyDraft(), speedKph: 90 }).success).toBe(false);
  });

  it("is the same list the stored-draft clamp uses", () => {
    const src = readFileSync("lib/storage.ts", "utf8");
    expect(src).toContain(`const steps: SpeedKph[] = [${STEPS.join(", ")}];`);
  });

  it("is the same top end the slider offers", () => {
    /* A slider that stops at 140 makes the last step of the union unreachable,
       and a slider that runs past the union feeds it a value no consumer
       knows. Neither shows up as a type error. */
    const src = readFileSync("components/advisor/ResultView.tsx", "utf8");
    expect(src).toContain(`max={${STEPS[STEPS.length - 1]}}`);
  });
});

/* The route and the conditions the hint is written about. */
const KM = 790;
const T = -0.5;

function totalAt(carIdx: number, kph: SpeedKph): number {
  const car = getCars()[carIdx]!;
  const r = computeRange(car, T, kph, 1, 1);
  return computeTripPlan(car, r.midKm, KM, kph, 1, r.lowKm, r.highKm, T, true)
    .totalSpan.mid;
}

describe("what the speed hint claims", () => {
  it("names 110, 150 and charging speed, since that is what it rests on", () => {
    expect(COPY.qSpeedHint).toContain("100 km/h");
    expect(COPY.qSpeedHint).toContain("150 km/h");
    expect(COPY.qSpeedHint).toMatch(/nachlädt|laden/);
  });

  it("is right that a fast charger is mostly still earlier at 150 than at 130", () => {
    const cars = getCars();
    const fast = cars
      .map((c, i) => ({ i, id: c.id, car: c, min: charge1080Min(c, T).mid }))
      .filter((x) => x.min <= 35);
    expect(fast.length, "no fast chargers in the catalogue to test").toBeGreaterThan(5);
    const later = fast.filter((f) => totalAt(f.i, 150) > totalAt(f.i, 130));
    /* The hint says "meist", and it has to mean it. The cars that break the
       pattern all break it the same way, and it is worth naming: a quick
       charger on a small battery still needs another stop, and the stop it
       saves time on is one it would not have had to make at all. Volvo EX30,
       MG 4 Standard, Cupra Born and Citroen e-C3 are the four, all under
       60 kWh usable. */
    expect(later.length / fast.length).toBeLessThan(0.2);
    for (const f of later) {
      expect(f.car.usableKwh, `${f.id} breaks the pattern on a large battery`)
        .toBeLessThan(60);
    }
  });

  it("is right about a fast charger that also has the battery for it", () => {
    const cars = getCars();
    const roomy = cars
      .map((c, i) => ({ i, id: c.id, min: charge1080Min(c, T).mid, kwh: c.usableKwh }))
      .filter((x) => x.min <= 35 && x.kwh >= 60);
    expect(roomy.length).toBeGreaterThan(10);
    for (const r of roomy) {
      expect(totalAt(r.i, 150), `${r.id} (${r.min} min, ${r.kwh} kWh) is slower at 150`)
        .toBeLessThanOrEqual(totalAt(r.i, 130));
    }
  });

  it("is right that a slow charger loses the time again at the pillar", () => {
    const cars = getCars();
    const slow = cars
      .map((c, i) => ({ i, id: c.id, min: charge1080Min(c, T).mid }))
      .filter((x) => x.min >= 45);
    expect(slow.length, "no slow chargers in the catalogue to test").toBeGreaterThan(3);
    let worse = 0;
    for (const s of slow) {
      if (totalAt(s.i, 150) > totalAt(s.i, 130)) worse++;
    }
    /* Not every slow charger loses: a slow charger with a big enough battery
       gets there without the extra stop. The claim is about the tendency, and
       the tendency has to be the clear majority for the sentence to be fair. */
    expect(worse / slow.length).toBeGreaterThan(0.6);
  });

  it("does not claim the slowest step is the quickest way there, because it is not", () => {
    /* The old wording implied it. Over this route the bottom of the slider is
       slower in total than 130 for all but the weakest cars, so the hint may
       only say that it uses the least energy. */
    const cars = getCars();
    let slowerAt110 = 0;
    for (let i = 0; i < cars.length; i++) {
      if (totalAt(i, 100) > totalAt(i, 130)) slowerAt110++;
    }
    expect(slowerAt110 / cars.length).toBeGreaterThan(0.8);
    expect(COPY.qSpeedHint).not.toMatch(/am günstigsten fahren/i);
  });
});
