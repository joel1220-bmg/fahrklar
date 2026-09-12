import { describe, expect, it } from "vitest";
import { computeRange, computeTrip, computeTripPlan, tempFactor } from "./range";
import type { Car } from "./types";

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
  it("needs stop when rangeMid * 0.75 < routeKm", () => {
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

  it("winter month (shorter range) means more stops or longer total than summer", () => {
    const winterRange = computeRange(base, -0.5, 120, 0.9, 2);
    const summerRange = computeRange(base, 18.5, 120, 0.9, 2);
    const tripKm = 700;
    const winter = computeTripPlan(base, winterRange.midKm, tripKm, 120);
    const summer = computeTripPlan(base, summerRange.midKm, tripKm, 120);
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
