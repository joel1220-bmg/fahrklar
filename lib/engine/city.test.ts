/**
 * City range, added 13.09.2026.
 *
 * The trap this model exists to avoid: reusing the Autobahn model with a low
 * speed. `speedFactor` is a drag power law anchored at 130 km/h, so feeding it
 * 40 returns 0.15 and would promise a city range roughly six times the motorway
 * one. That is not what happens in a town, where rolling resistance and the
 * heater dominate. So the city figure is anchored on the catalogue's own WLTP
 * number instead, and these tests pin the properties that must hold whatever
 * the constants are tuned to.
 */

import { describe, expect, it } from "vitest";
import climateJson from "@/data/climate-months.de.json";
import { computeCityRange, computeRange } from "./range";
import { getCars } from "./evaluate";
import type { Car } from "./types";

const months = (climateJson as { months: Record<string, number> }).months;
const DEC = months["12"]!;
const JUN = months["6"]!;

function car(id: string): Car {
  const hit = getCars().find((c) => c.id === id);
  if (!hit) throw new Error(`unknown car ${id}`);
  return hit;
}

describe("city range is a range", () => {
  it("brackets its own middle for every car", () => {
    for (const c of getCars()) {
      const r = computeCityRange(c, JUN);
      expect(r.lowKm).toBeLessThan(r.midKm);
      expect(r.midKm).toBeLessThan(r.highKm);
    }
  });

  it("is wider than the motorway band, because city driving varies more", () => {
    const c = car("vw-id3");
    const city = computeCityRange(c, JUN);
    const road = computeRange(c, JUN, 130, 1, 2);
    const spread = (s: { lowKm: number; highKm: number; midKm: number }) =>
      (s.highKm - s.lowKm) / s.midKm;
    expect(spread(city)).toBeGreaterThan(spread(road));
  });
});

describe("city range beats the motorway, but not absurdly", () => {
  it("is higher than the Autobahn figure for every car", () => {
    for (const c of getCars()) {
      const city = computeCityRange(c, JUN);
      const road = computeRange(c, JUN, 130, 1, 2);
      expect(city.midKm, c.id).toBeGreaterThan(road.midKm);
    }
  });

  it("never runs away from it — the drag law at town speed would", () => {
    /* speedFactor(40) is about 0.15, so the naive model would put city range
       near 6x the motorway one. Anything past 2.2x means that mistake has crept
       back in. */
    for (const c of getCars()) {
      const city = computeCityRange(c, JUN);
      const road = computeRange(c, JUN, 130, 1, 2);
      expect(city.midKm / road.midKm, c.id).toBeLessThan(2.2);
    }
  });

  it("may beat the brochure in town, but only within reason", () => {
    /* WLTP is a combined cycle including motorway, so a pure-town figure
       exceeding it is correct physics, not inflation. An earlier version of
       this file capped the span at wltpKm and that cap pushed one car's city
       range below its own motorway range. What has to hold is that the excess
       stays modest. */
    for (const c of getCars()) {
      expect(computeCityRange(c, JUN).highKm / c.wltpKm, c.id).toBeLessThan(1.35);
      expect(computeCityRange(c, DEC).midKm, c.id).toBeLessThan(c.wltpKm);
    }
  });
});

describe("winter costs more in town than on the motorway", () => {
  it("is shorter in December than in June for every car", () => {
    for (const c of getCars()) {
      expect(computeCityRange(c, DEC).midKm, c.id).toBeLessThan(
        computeCityRange(c, JUN).midKm,
      );
    }
  });

  it("hits a car without a heat pump harder", () => {
    const withPump = getCars().find((c) => c.heatPump);
    const without = getCars().find((c) => !c.heatPump);
    if (!withPump || !without) return; // catalogue may not contain both
    const drop = (c: Car) =>
      1 - computeCityRange(c, DEC).midKm / computeCityRange(c, JUN).midKm;
    expect(drop(without)).toBeGreaterThan(drop(withPump));
  });

  it("loses a larger share in town than on the motorway, because the heater runs per hour", () => {
    const c = car("vw-id3");
    const cityDrop = 1 - computeCityRange(c, DEC).midKm / computeCityRange(c, JUN).midKm;
    const roadDrop =
      1 - computeRange(c, DEC, 130, 1, 2).midKm / computeRange(c, JUN, 130, 1, 2).midKm;
    expect(cityDrop).toBeGreaterThan(roadDrop);
  });
});

describe("state of charge", () => {
  it("scales the range", () => {
    const c = car("vw-id3");
    const full = computeCityRange(c, JUN, 1);
    const half = computeCityRange(c, JUN, 0.5);
    expect(half.midKm).toBeLessThan(full.midKm);
    expect(half.midKm / full.midKm).toBeCloseTo(0.5, 1);
  });
});
