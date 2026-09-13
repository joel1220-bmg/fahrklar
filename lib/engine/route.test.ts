/**
 * The drawn route has to keep growing with the trip.
 *
 * Reported 13.09.2026: between 850 and 900 km the line on the map stopped
 * getting longer. The cause sat one step earlier than the symptom — the sketch
 * corridor was the Hamburg–München route at 790 km while the slider offered
 * 900, and tripPolyline clamps to the corridor. So every trip past 790 km drew
 * the identical full line, and the charging stops beyond it piled up on the
 * last point because pointAtKm clamps too.
 */

import { describe, expect, it } from "vitest";
import { geodesicKm, pointAtKm, tripPolyline } from "./range";
import { evaluateCars, routes, tripMaxKm } from "./evaluate";
import { emptyDraft } from "./types";

const SPINE = routes.find((r) => r.id === "spineDe")!;

function drawnKm(poly: [number, number][]): number {
  let sum = 0;
  for (let i = 1; i < poly.length; i++) sum += geodesicKm(poly[i - 1]!, poly[i]!);
  return sum;
}

describe("the sketch corridor", () => {
  it("is long enough for the longest trip the slider offers", () => {
    expect(SPINE.km).toBeGreaterThanOrEqual(tripMaxKm());
  });

  it("hands the slider a maximum it can actually draw", () => {
    const poly = tripPolyline(SPINE.polyline, tripMaxKm(), SPINE.km);
    // The corridor is scaled to SPINE.km, so a full-length trip must use
    // essentially all of it.
    const share = drawnKm(poly) / drawnKm(SPINE.polyline);
    expect(share).toBeGreaterThan(0.95);
  });
});

describe("a longer trip draws a longer line", () => {
  const lengths = [200, 400, 600, 800, 850, 900];

  it("grows at every step, including past the old 790 km wall", () => {
    let previous = 0;
    for (const km of lengths) {
      const drawn = drawnKm(tripPolyline(SPINE.polyline, km, SPINE.km));
      expect(drawn).toBeGreaterThan(previous);
      previous = drawn;
    }
  });

  it("850 and 900 km are not the same line", () => {
    const a = drawnKm(tripPolyline(SPINE.polyline, 850, SPINE.km));
    const b = drawnKm(tripPolyline(SPINE.polyline, 900, SPINE.km));
    expect(b).toBeGreaterThan(a);
  });

  it("draws roughly the distance it was asked for", () => {
    for (const km of lengths) {
      const drawn = drawnKm(tripPolyline(SPINE.polyline, km, SPINE.km));
      const scaled = (drawn / drawnKm(SPINE.polyline)) * SPINE.km;
      expect(Math.abs(scaled - km)).toBeLessThan(km * 0.05);
    }
  });
});

describe("charging stops stay on the line", () => {
  it("does not pile the late stops onto the last point", () => {
    const draft = { ...emptyDraft(), use: "city" as const, charge: "home" as const, tripKm: 900 };
    const e = evaluateCars(draft);
    const withStops = e.results.find((r) => r.trip.active && r.trip.stops.length > 1);
    expect(withStops).toBeDefined();
    if (!withStops || !withStops.trip.polyline) return;

    const seen = withStops.trip.stops.map((s) =>
      pointAtKm(withStops.trip.polyline!, s.afterKm),
    );
    for (let i = 1; i < seen.length; i++) {
      // Consecutive stops are hundreds of km apart, so their points must be too.
      expect(geodesicKm(seen[i - 1]!, seen[i]!)).toBeGreaterThan(20);
    }
  });
});
