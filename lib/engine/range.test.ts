import { describe, expect, it } from "vitest";
import { computeRange, computeTrip, computeTripPlan, tempFactor, tempFactorCharge, tripLegs } from "./range";
import type { Car } from "./types";
import { getCars } from "./evaluate";

const base: Car = {
  id: "t",
  brand: "Test",
  model: "X",
  body: "hatch",
  seats: 5,
  listEur: 40000,
  usableKwh: 60,
  wltpKm: 400,
  highwayKwhPer100: 18,
  dcPeakKw: 150,
  heatPump: true,
  colorHex: "#000",
  asOf: "2026-09-12",
};

describe("tempFactor", () => {
  it("heatPump is milder than PTC in winter", () => {
    const hp = tempFactor(-5, true);
    const ptc = tempFactor(-5, false);
    expect(ptc).toBeGreaterThan(hp);
    expect(hp).toBeGreaterThan(1);
  });
});

describe("computeRange winter vs summer", () => {
  it("winter span is shorter than summer", () => {
    const winter = computeRange(base, -0.5, 130, 0.9, 2);
    const summer = computeRange(base, 18.5, 130, 0.9, 2);
    expect(winter.midKm).toBeLessThan(summer.midKm);
    expect(winter.lowKm).toBeLessThan(winter.highKm);
    expect(summer.lowKm).toBeLessThan(summer.highKm);
  });

  it("heatPump car keeps more range than PTC twin in cold", () => {
    const hp = computeRange(base, 0, 130, 0.9, 2);
    const ptc = computeRange({ ...base, heatPump: false }, 0, 130, 0.9, 2);
    expect(hp.midKm).toBeGreaterThan(ptc.midKm);
  });

  it("higher speed reduces range", () => {
    const s120 = computeRange(base, 15, 120, 0.9, 2);
    const s140 = computeRange(base, 15, 140, 0.9, 2);
    expect(s120.midKm).toBeGreaterThan(s140.midKm);
  });
});

describe("computeTrip", () => {
  it("needs stop when firstLeg (SoC window) < routeKm", () => {
    const short = computeTrip(500, 350);
    expect(short.needsStop).toBe(false);
    const long = computeTrip(400, 400);
    expect(long.needsStop).toBe(true);
    expect(long.stopAfterKm).not.toBeNull();
  });

  it("no stop when mid range covers trip with buffer", () => {
    const t = computeTrip(900, 575);
    expect(t.needsStop).toBe(false);
  });
});

describe("computeTripPlan", () => {
  it("300 km needs fewer stops than 800 km", () => {
    const rangeMid = 350;
    const short = computeTripPlan(base, rangeMid, 300, 120);
    const long = computeTripPlan(base, rangeMid, 800, 120);
    expect(short.stops.length).toBeLessThan(long.stops.length);
    expect(long.stops.length).toBeGreaterThan(0);
  });

  it("winter month (shorter range / colder charge) means more stops or longer total than summer", () => {
    const winterRange = computeRange(base, -0.5, 120, 0.9, 2);
    const summerRange = computeRange(base, 18.5, 120, 0.9, 2);
    const tripKm = 700;
    const winter = computeTripPlan(base, winterRange.midKm, tripKm, 120, 0.9, undefined, undefined, -0.5);
    const summer = computeTripPlan(base, summerRange.midKm, tripKm, 120, 0.9, undefined, undefined, 18.5);
    const worse =
      winter.stops.length > summer.stops.length ||
      winter.totalMin > summer.totalMin;
    expect(worse).toBe(true);
  });

  it("120 vs 140 speed: higher speed shortens drive but may change total", () => {
    const range120 = computeRange(base, 15, 120, 0.9, 2);
    const range140 = computeRange(base, 15, 140, 0.9, 2);
    const p120 = computeTripPlan(base, range120.midKm, 500, 120);
    const p140 = computeTripPlan(base, range140.midKm, 500, 140);
    expect(p120.driveMin).toBeGreaterThan(p140.driveMin);
  });

  it("stop minutes include 8 min overhead in display value", () => {
    const plan = computeTripPlan(base, 200, 500, 120);
    expect(plan.stops.length).toBeGreaterThan(0);
    for (const s of plan.stops) {
      expect(s.minutes).toBeGreaterThan(8);
      expect(s.afterKm).toBeGreaterThan(0);
    }
    expect(plan.extraMin).toBe(plan.chargeMin + plan.stops.length * 8);
    expect(plan.totalMin).toBe(plan.driveMin + plan.extraMin);
  });
});

describe("computeTripPlan Ladezeit / Ladekurve handoff", () => {
  it("firstLeg = range100*(startSoc-0.10); later = range100*0.70", () => {
    const rangeMid = 400;
    const startSoc = 0.9;
    const { firstLeg, laterLeg } = tripLegs(rangeMid, startSoc);
    const plan = computeTripPlan(base, rangeMid, 900, 120, startSoc);
    expect(plan.usableLeg).toBe(Math.round(firstLeg));
    expect(plan.stops[0]!.afterKm).toBe(Math.round(firstLeg));
    expect(plan.stops.length).toBeGreaterThan(1);
    expect(plan.stops[1]!.afterKm).toBe(Math.round(firstLeg + laterLeg));
  });
});

describe("tempFactorCharge", () => {
  it("warm ~1; colder lowers avgKw factor when preconditioned", () => {
    expect(tempFactorCharge(20, true)).toBeCloseTo(1, 2);
    expect(tempFactorCharge(0, true)).toBeCloseTo(0.9, 2);
    expect(tempFactorCharge(0, false)).toBeCloseTo(0.65, 2);
    expect(tempFactorCharge(-7, true)).toBeCloseTo(0.85, 2);
    expect(tempFactorCharge(0, false)).toBeLessThan(tempFactorCharge(0, true));
  });
});

describe("avgKwSpanForCar catalog", () => {
  it("Ioniq 5 mid is ~175, not peak×0.55", async () => {
    const { avgKwSpanForCar } = await import("./charge");
    const ioniq = { ...base, id: "hyundai-ioniq5", dcPeakKw: 235 };
    const span = avgKwSpanForCar(ioniq);
    expect(span.mid).toBe(175);
    expect(span.mid).not.toBe(Math.round(235 * 0.55));
  });
});

describe("computeTripPlan charge temperature", () => {
  it("colder outdoorC lengthens stop minutes at same range", () => {
    const warm = computeTripPlan(base, 250, 600, 120, 0.9, undefined, undefined, 20);
    const cold = computeTripPlan(base, 250, 600, 120, 0.9, undefined, undefined, -7);
    expect(warm.stops.length).toBe(cold.stops.length);
    expect(cold.stops[0]!.minutes).toBeGreaterThan(warm.stops[0]!.minutes);
    expect(cold.extraMin).toBeGreaterThan(warm.extraMin);
  });

  it("outdoorC 20 vs 25 stays near warm", () => {
    const a = computeTripPlan(base, 250, 600, 120, 0.9, undefined, undefined, 20);
    const b = computeTripPlan(base, 250, 600, 120, 0.9, undefined, undefined, 22);
    expect(Math.abs(a.stops[0]!.minutes - b.stops[0]!.minutes)).toBeLessThanOrEqual(1);
  });
});

/**
 * The comparison table prints the stop count and the extra-time span on two
 * rows, one above the other. Before 13.09.2026 they could disagree: the BYD
 * Seal showed "Ladestopps 1" over "0 bis 18 Min", because the optimistic range
 * cleared the route without stopping. A reader has no way to reconcile that,
 * and a lower bound of zero under a stop count of one reads as a broken
 * figure, not as a lucky case.
 */
describe("the extra-time span describes the journey above it", () => {
  it("never offers zero extra minutes when the plan stops", () => {
    for (const car of getCars()) {
      for (const km of [300, 520, 790]) {
        const r = computeRange(car, 14, 120, 1, 1);
        const p = computeTripPlan(car, r.midKm, km, 120, 1, r.lowKm, r.highKm, 14, true);
        if (p.stops.length > 0) {
          expect(p.extraSpan.low, `${car.id} at ${km} km`).toBeGreaterThan(0);
        }
      }
    }
  });

  it("offers no extra minutes at all when the plan does not stop", () => {
    for (const car of getCars()) {
      const r = computeRange(car, 14, 120, 1, 1);
      const p = computeTripPlan(car, r.midKm, 200, 120, 1, r.lowKm, r.highKm, 14, true);
      if (p.stops.length === 0) {
        expect(p.extraSpan.high, car.id).toBe(0);
      }
    }
  });

  it("keeps the span inside what the charging data can justify", () => {
    /* Everything left in the width comes from AVG_KW_10_80's own low-to-high
       range. If a span ever grows past twice its middle again, a scenario has
       started describing a different trip. */
    for (const car of getCars()) {
      const r = computeRange(car, 14, 120, 1, 1);
      const p = computeTripPlan(car, r.midKm, 520, 120, 1, r.lowKm, r.highKm, 14, true);
      if (p.extraMin > 0) {
        expect(
          (p.extraSpan.high - p.extraSpan.low) / p.extraMin,
          `${car.id} span is ${p.extraSpan.low}-${p.extraSpan.high} around ${p.extraMin}`,
        ).toBeLessThan(1.5);
      }
    }
  });
});
