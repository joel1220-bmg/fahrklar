/**
 * The first question changed axis on 13.09.2026.
 *
 * It used to mix distance ("Alltag", "Lange Autobahnfahrten") with space
 * ("Familie"); space is already asked outright as the body shape, so the four
 * options became three that only ask how far the car has to go.
 *
 * A draft saved before that carries a retired value. Dropping it would throw
 * away the reader's whole saved answer set over one field, so it is translated
 * rather than rejected.
 */

import { describe, expect, it } from "vitest";
import { draftSchema } from "./schema";
import { emptyDraft } from "./engine/types";
import { evaluateCars } from "./engine/evaluate";
import { USE_CHIP } from "./copy";

function saved(use: string) {
  return { ...emptyDraft(), use };
}

describe("the retired use cases still load", () => {
  const cases: [string, string][] = [
    ["everyday", "city"],
    ["family", "cityTrips"],
    ["mixed", "cityTrips"],
    ["highway", "longDistance"],
  ];

  for (const [old, expected] of cases) {
    it(`translates "${old}" to "${expected}"`, () => {
      const parsed = draftSchema.safeParse(saved(old));
      expect(parsed.success).toBe(true);
      if (parsed.success) expect(parsed.data.use).toBe(expected);
    });
  }

  it("keeps a current value untouched", () => {
    for (const key of Object.keys(USE_CHIP)) {
      const parsed = draftSchema.safeParse(saved(key));
      expect(parsed.success).toBe(true);
      if (parsed.success) expect(parsed.data.use).toBe(key);
    }
  });

  it("still allows no answer at all", () => {
    const parsed = draftSchema.safeParse({ ...emptyDraft(), use: null });
    expect(parsed.success).toBe(true);
  });

  it("rejects a value that never existed", () => {
    expect(draftSchema.safeParse(saved("spaceship")).success).toBe(false);
  });
});

describe("the three options are one axis: how far", () => {
  it("offers exactly three, and no space-related option", () => {
    const keys = Object.keys(USE_CHIP);
    expect(keys).toEqual(["city", "cityTrips", "longDistance"]);
    const labels = Object.values(USE_CHIP).join(" ").toLowerCase();
    expect(labels).not.toContain("familie");
  });

  it("puts the longest-legged car first for regular long trips", () => {
    const e = evaluateCars({ ...emptyDraft(), use: "longDistance", charge: "home" });
    /* Expensive outliers are pushed down before the use case is even
       consulted, so the comparison has to be made among the cars the reader is
       actually being offered. */
    const offered = e.results.filter((r) => !r.priceOutlier);
    expect(offered.length).toBeGreaterThan(1);
    const ranges = offered.map((r) => r.range.midKm);
    expect(ranges[0]).toBe(Math.max(...ranges));
  });

  it("leads with the cheaper car when the driving stays in town", () => {
    const city = evaluateCars({ ...emptyDraft(), use: "city", charge: "home" });
    const far = evaluateCars({ ...emptyDraft(), use: "longDistance", charge: "home" });
    expect(city.results[0]!.car.listEur).toBeLessThan(far.results[0]!.car.listEur);
  });
});
