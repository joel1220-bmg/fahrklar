/**
 * Backlog #13 - the gaps that would hurt if they broke silently: empty
 * selection, extreme inputs, a heat-pump-less car in deep winter, the
 * charging-stop boundary, and startSoc below the 10 % reserve.
 */

import { describe, expect, it } from "vitest";
import { evaluateCars, getCars } from "./evaluate";
import { computeRange, computeTripPlan, tripLegs } from "./range";
import { emptyDraft } from "./types";
import type { Car } from "./types";

function car(id: string): Car {
  const hit = getCars().find((c) => c.id === id);
  if (!hit) throw new Error(`unknown car ${id}`);
  return hit;
}

describe("empty selection", () => {
  it("a budget below the cheapest car never leaves the list truly empty", () => {
    const cheapest = Math.min(...getCars().map((c) => c.listEur));
    const draft = emptyDraft();
    draft.priceMax = cheapest - 1000;
    const { results } = evaluateCars(draft);
    // Documents the current fallback: evaluateCars would rather show the
    // whole catalog, all flagged as not fitting, than show nothing. If this
    // is not the intended product behaviour, components/advisor/ResultView's
    // `results.length === 0` branch is currently unreachable and dead.
    expect(results.length).toBe(getCars().length);
    expect(results.every((r) => r.priceFits === false)).toBe(true);
  });

  it("an impossible budget combined with a body filter still returns that body's cars", () => {
    const draft = emptyDraft();
    draft.bodies = ["hatch"];
    draft.priceMax = 1000;
    const { results } = evaluateCars(draft);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.car.body === "hatch")).toBe(true);
    expect(results.every((r) => r.priceFits === false)).toBe(true);
  });

  it("a budget that fits nobody does not crash sorting (single-car pool)", () => {
    // sedan+compact narrows the pool; an unreachable budget on top of that
    // exercises the sort/filter/fallback chain on a small pool, not just the
    // full 15-car catalog.
    const draft = emptyDraft();
    draft.bodies = ["sedan"];
    draft.priceMax = 100;
    const { results } = evaluateCars(draft);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.car.body === "sedan")).toBe(true);
  });
});

describe("extreme inputs", () => {
  it("0 km trip stays inactive, not a 0-stop active trip", () => {
    const draft = emptyDraft();
    draft.tripKm = 0;
    const { results, resolved } = evaluateCars(draft);
    expect(resolved.tripActive).toBe(false);
    for (const r of results) {
      expect(r.trip.active).toBe(false);
      expect(r.trip.stops).toEqual([]);
      expect(r.trip.totalMin).toBe(0);
      expect(r.trip.polyline).toBeNull();
    }
  });

  it("a 200 km normal day parses and is used verbatim, not clamped by the engine", () => {
    const draft = emptyDraft();
    draft.dayKm = "200";
    const { resolved, assumptions } = evaluateCars(draft);
    expect(resolved.dayKm).toBe(200);
    expect(resolved.dayAssumed).toBe(false);
    const day = assumptions.find((a) => a.key === "day");
    expect(day?.value).toBe("200 km");
    // The UI clamps the slider to 200; the engine itself must not silently
    // reinterpret or cap a value that already reached it.
  });

  it("a trip right at the 80 km activation threshold is exact, not off-by-one", () => {
    const below = emptyDraft();
    below.tripKm = 79;
    expect(evaluateCars(below).resolved.tripActive).toBe(false);

    const at = emptyDraft();
    at.tripKm = 80;
    expect(evaluateCars(at).resolved.tripActive).toBe(true);
  });
});

describe("a car with no heat pump in deep winter", () => {
  const noHp = car("byd-dolphin"); // heatPump: false, smallest battery in the catalog
  const hpTwin: Car = { ...noHp, id: "hp-twin", heatPump: true };

  it("still returns a finite, ordered range span, not NaN or a collapse", () => {
    const deepCold = -12; // colder than the coldest month in climate-months.de.json (-0.5)
    const r = computeRange(noHp, deepCold, 130, 1, 2);
    expect(Number.isFinite(r.lowKm)).toBe(true);
    expect(Number.isFinite(r.midKm)).toBe(true);
    expect(Number.isFinite(r.highKm)).toBe(true);
    expect(r.lowKm).toBeGreaterThan(0);
    expect(r.lowKm).toBeLessThan(r.midKm);
    expect(r.midKm).toBeLessThan(r.highKm);
  });

  it("loses more range than an otherwise-identical heat-pump car as it gets colder", () => {
    for (const outdoorC of [0, -5, -12]) {
      const withoutHp = computeRange(noHp, outdoorC, 130, 1, 2);
      const withHp = computeRange(hpTwin, outdoorC, 130, 1, 2);
      expect(withoutHp.midKm).toBeLessThan(withHp.midKm);
    }
  });

  it("a full deep-winter Hamburg-Munich run still produces a sane, finite plan", () => {
    const draft = emptyDraft();
    draft.bodies = ["hatch"];
    draft.tripKm = 790; // the hamMuc spine length
    draft.month = 1; // -0.5 degC, the coldest month on record here
    draft.startSoc = 1;
    const { results } = evaluateCars(draft);
    const dolphin = results.find((r) => r.car.id === "byd-dolphin")!;
    expect(dolphin).toBeTruthy();
    expect(dolphin.trip.active).toBe(true);
    expect(dolphin.trip.stops.length).toBeGreaterThan(0);
    expect(Number.isFinite(dolphin.trip.totalMin)).toBe(true);
    expect(dolphin.trip.totalMin).toBeGreaterThan(dolphin.trip.driveMin);
    // every stop must land strictly inside the route, in order (guards the
    // charge loop against ever stalling or overshooting on a marginal car)
    let prev = 0;
    for (const s of dolphin.trip.stops) {
      expect(s.afterKm).toBeGreaterThan(prev);
      expect(s.afterKm).toBeLessThan(790);
      prev = s.afterKm;
    }
  });
});

describe("the boundary where a trip stops needing a charging stop at all", () => {
  const base = car("skoda-elroq");
  const speed = 120;
  const startSoc = 0.9;
  const outdoorC = 15;
  const range = computeRange(base, outdoorC, speed, startSoc, 2);
  const { firstLeg } = tripLegs(range.midKm, startSoc);

  it("a trip that fits inside the first leg needs no stop at all", () => {
    const tripKm = Math.floor(firstLeg); // strictly inside the SoC window
    const plan = computeTripPlan(base, range.midKm, tripKm, speed, startSoc, undefined, undefined, outdoorC);
    expect(plan.stops).toEqual([]);
    expect(plan.chargeMin).toBe(0);
    expect(plan.extraMin).toBe(0);
    expect(plan.totalMin).toBe(plan.driveMin);
  });

  it("right at the +0.5 km rounding edge still needs no stop", () => {
    const tripKm = firstLeg + 0.5;
    const plan = computeTripPlan(base, range.midKm, tripKm, speed, startSoc, undefined, undefined, outdoorC);
    expect(plan.stops).toEqual([]);
  });

  it("one km past that edge flips to exactly one stop", () => {
    const tripKm = firstLeg + 1.6;
    const plan = computeTripPlan(base, range.midKm, tripKm, speed, startSoc, undefined, undefined, outdoorC);
    expect(plan.stops.length).toBe(1);
    // Just over the edge the top-up is tiny enough that the charge portion
    // itself rounds to 0 min - only the fixed overhead shows - so check the
    // overhead shows up in the total rather than assuming chargeMin > 0 here.
    expect(plan.totalMin).toBeGreaterThan(plan.driveMin);
  });

  it("well past the edge, the stop actually costs charging time, not just overhead", () => {
    const tripKm = firstLeg + 60;
    const plan = computeTripPlan(base, range.midKm, tripKm, speed, startSoc, undefined, undefined, outdoorC);
    expect(plan.stops.length).toBeGreaterThanOrEqual(1);
    expect(plan.chargeMin).toBeGreaterThan(0);
  });
});

describe("startSoc below the 10 % reserve", () => {
  const base = car("vw-id3");

  it("computeRange and tripLegs agree on the same effective floor (regression: they used to disagree)", () => {
    // Before the fix, computeRange clamped startSoc at 0.10 but tripLegs
    // clamped it at 0.15, so for any raw startSoc in [0.10, 0.15) the first
    // leg was computed as if the battery held more charge than computeRange
    // actually gave it. At startSoc === 0.10 - a value the input schema
    // explicitly allows as its minimum - the mismatch was largest.
    for (const startSoc of [0.05, 0.1, 0.12]) {
      const range = computeRange(base, 15, 130, startSoc, 2);
      const legs = tripLegs(range.midKm, startSoc);
      // With a matching floor, range100 recovers the same usable-based range
      // computeRange used, to within rounding: range100 * soc ~= range.midKm.
      const soc = Math.max(0.1, Math.min(1, startSoc));
      expect(legs.range100 * soc).toBeCloseTo(range.midKm, 0);
    }
  });

  it("does not silently jump at the old 0.15 threshold", () => {
    const range = computeRange(base, 15, 130, 0.2, 2);
    const legsAt014 = tripLegs(range.midKm, 0.14);
    const legsAt016 = tripLegs(range.midKm, 0.16);
    // Two nearby raw values either side of the old (wrong) 0.15 clamp must
    // produce continuous, close firstLeg values now - not a step change.
    expect(Math.abs(legsAt016.firstLeg - legsAt014.firstLeg)).toBeLessThan(
      Math.abs(legsAt016.firstLeg) * 0.3,
    );
  });

  it("starting exactly at the reserve gives an (almost) immediate first stop, not a full SoC-window leg", () => {
    const range = computeRange(base, 15, 130, 0.1, 2);
    const legs = tripLegs(range.midKm, 0.1);
    // firstLeg = range100 * (soc - 0.1) -> 0 at the exact reserve line; the
    // Math.max(1, ...) guard is what keeps it a sane positive minimum.
    expect(legs.firstLeg).toBe(1);
  });

  it("evaluateCars accepts a startSoc under the reserve without crashing and reports it honestly", () => {
    const draft = emptyDraft();
    draft.tripKm = 400;
    draft.startSoc = 0.05;
    const { results, assumptions } = evaluateCars(draft);
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(Number.isFinite(r.trip.totalMin)).toBe(true);
      expect(r.trip.stops.length).toBeGreaterThan(0);
    }
    const start = assumptions.find((a) => a.key === "start");
    expect(start?.value).toBe("5 %");
  });

  it("fewer or equal stops as startSoc rises, monotonically, across the old clamp boundary", () => {
    const tripKm = 500;
    let prevStops = Infinity;
    for (const startSoc of [0.05, 0.1, 0.14, 0.16, 0.2, 0.3]) {
      const range = computeRange(base, 15, 130, startSoc, 2);
      const plan = computeTripPlan(base, range.midKm, tripKm, 130, startSoc, undefined, undefined, 15);
      expect(plan.stops.length).toBeLessThanOrEqual(prevStops);
      prevStops = plan.stops.length;
    }
  });
});
