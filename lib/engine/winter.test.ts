/**
 * Winter Autobahn behaviour — the claims this product lives or dies on.
 *
 * Written after a real critique of a planned 840 km December run in a Škoda
 * Elroq 85: the plan put a 44-minute charging stop 12 km from the destination,
 * and the range was several percent too optimistic because cold, dense air was
 * not modelled at all.
 */

import { describe, expect, it } from "vitest";
import carsJson from "@/data/cars.de.json";
import climateJson from "@/data/climate-months.de.json";
import {
  airDensityFactor,
  computeRange,
  computeTripPlan,
  highwayConsumption,
} from "./range";
import { OVERHEAD_MIN, STOP_ENERGY_FRAC } from "./charge";
import type { Car } from "./types";

const cars = ((carsJson as { cars?: Car[] }).cars ?? (carsJson as unknown as Car[])) as Car[];
const months = (climateJson as { months: Record<string, number> }).months;
const DEC = months["12"]!;

function car(id: string): Car {
  const hit = cars.find((c) => c.id === id);
  if (!hit) throw new Error(`unknown car ${id}`);
  return hit;
}

describe("cold air is denser and costs energy", () => {
  it("is neutral at the reference temperature", () => {
    expect(airDensityFactor(15)).toBeCloseTo(1, 5);
  });

  it("costs a few percent in December, not tens of percent", () => {
    const f = airDensityFactor(DEC);
    expect(f).toBeGreaterThan(1.02);
    expect(f).toBeLessThan(1.06);
  });

  it("gives a small benefit in high summer", () => {
    expect(airDensityFactor(30)).toBeLessThan(1);
  });

  it("raises December Autobahn consumption above the cabin-heat term alone", () => {
    const elroq = car("skoda-elroq");
    const summer = highwayConsumption(elroq, 15, 130, 2);
    const winter = highwayConsumption(elroq, DEC, 130, 2);
    // Cabin heat alone gave ~1.17x; with dense air it must be clearly more.
    expect(winter / summer).toBeGreaterThan(1.2);
  });
});

describe("a charging stop is sized by the road ahead", () => {
  const elroq = car("skoda-elroq");
  const range = computeRange(elroq, DEC, 130, 1, 2);
  const plan = computeTripPlan(
    elroq,
    range.midKm,
    840,
    130,
    1,
    range.lowKm,
    range.highKm,
    DEC,
    true,
  );

  it("still needs several stops over 840 winter kilometres", () => {
    expect(plan.stops.length).toBeGreaterThanOrEqual(2);
  });

  it("never parks for a full 10-80 % charge just short of the destination", () => {
    const last = plan.stops[plan.stops.length - 1]!;
    const remainingKm = 840 - last.afterKm;
    if (remainingKm < 100) {
      // A short hop home must be a short stop, not a slab of battery.
      expect(last.minutes).toBeLessThan(25);
    }
  });

  it("keeps every stop inside the fast part of the curve", () => {
    const kwhCap = elroq.usableKwh * STOP_ENERGY_FRAC;
    // 10-80 % at the December-derated average, plus the fixed overhead, is the
    // ceiling any single stop may reach.
    const ceiling = (kwhCap / (100 * 0.9)) * 60 + OVERHEAD_MIN + 1;
    for (const s of plan.stops) {
      expect(s.minutes).toBeLessThanOrEqual(Math.round(ceiling));
    }
  });

  it("orders stops along the route and stops short of the destination", () => {
    let prev = 0;
    for (const s of plan.stops) {
      expect(s.afterKm).toBeGreaterThan(prev);
      expect(s.afterKm).toBeLessThan(840);
      prev = s.afterKm;
    }
  });

  it("does not pretend a winter 840 km run is quicker than the summer one", () => {
    const summerRange = computeRange(elroq, 15, 130, 1, 2);
    const summer = computeTripPlan(
      elroq,
      summerRange.midKm,
      840,
      130,
      1,
      summerRange.lowKm,
      summerRange.highKm,
      15,
      true,
    );
    expect(plan.totalMin).toBeGreaterThan(summer.totalMin);
  });
});

describe("range stays a range", () => {
  it("brackets the mid and never collapses to a point", () => {
    for (const c of cars) {
      const r = computeRange(c, DEC, 130, 1, 2);
      expect(r.lowKm).toBeLessThan(r.midKm);
      expect(r.midKm).toBeLessThan(r.highKm);
    }
  });

  it("is lower in December than in June for every car", () => {
    for (const c of cars) {
      const dec = computeRange(c, DEC, 130, 1, 2);
      const jun = computeRange(c, months["6"]!, 130, 1, 2);
      expect(dec.midKm).toBeLessThan(jun.midKm);
    }
  });
});
