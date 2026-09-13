/**
 * Every drawn route has to lie inside the country the map draws.
 *
 * Reported 13.09.2026: the route started outside the German border. Extending
 * the sketch corridor northwards had put its first point above the coarse
 * outline, which cut straight from Sylt to Kiel and left the whole Schleswig
 * peninsula outside the drawn country. A second, quieter version of the same
 * mistake: the corridor's southern end sat in Kufstein, which is in Austria —
 * the coarse outline happened to cover it, so it looked right while being
 * wrong.
 *
 * Checking it by eye is exactly what failed here, so it is checked by
 * arithmetic instead.
 */

import { describe, expect, it } from "vitest";
import { OUTLINE } from "@/components/showroom/GermanyMap";
import { routes } from "./evaluate";

/** Ray casting in (lng, lat) space. */
function inside(lat: number, lng: number, poly: [number, number][]): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [latI, lngI] = poly[i]!;
    const [latJ, lngJ] = poly[j]!;
    const straddles = latI > lat !== latJ > lat;
    if (!straddles) continue;
    const crossing = ((lngJ - lngI) * (lat - latI)) / (latJ - latI) + lngI;
    if (lng < crossing) hit = !hit;
  }
  return hit;
}

describe("the outline itself", () => {
  it("is a closed ring with enough points to be a country", () => {
    expect(OUTLINE.length).toBeGreaterThan(20);
    expect(OUTLINE[0]).toEqual(OUTLINE[OUTLINE.length - 1]);
  });

  it("includes the Flensburg corner rather than cutting it off", () => {
    // Flensburg, the northern anchor of the sketch corridor.
    expect(inside(54.78, 9.43, OUTLINE)).toBe(true);
  });

  it("does not reach into Austria south of Munich", () => {
    // Kufstein. Inside the old coarse ring, and wrong.
    expect(inside(47.58, 12.17, OUTLINE)).toBe(false);
  });
});

describe("every route stays in the country", () => {
  for (const route of routes) {
    it(`${route.id} has no point outside the border`, () => {
      const strays = route.polyline
        .map((p, i) => ({ i, p }))
        .filter(({ p }) => !inside(p[0]!, p[1]!, OUTLINE));
      expect(strays).toEqual([]);
    });
  }
});
