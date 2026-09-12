import { describe, expect, it } from "vitest";
import { computeRange, computeTrip, tempFactor } from "./range";
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
  it("needs stop when rangeMid * 0.85 < routeKm", () => {
    const short = computeTrip(500, 400);
    expect(short.needsStop).toBe(false);
    const long = computeTrip(400, 790);
    expect(long.needsStop).toBe(true);
    expect(long.stopAfterKm).not.toBeNull();
  });

  it("no stop when mid range covers trip with buffer", () => {
    const t = computeTrip(900, 575);
    expect(t.needsStop).toBe(false);
  });
});
