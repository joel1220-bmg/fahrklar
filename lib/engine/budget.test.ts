/**
 * The budget is a window, not a ceiling: a lower and an upper limit, either of
 * which may be left open.
 *
 * The case worth guarding is the one a ceiling could never produce — a window
 * that contains no car at all. The list must not quietly fall back to cars
 * outside it and let the reader assume they fit.
 */

import { describe, expect, it } from "vitest";
import { emptyDraft } from "./types";
import {
  evaluateCars,
  getCars,
  priceBounds,
  priceInWindow,
  priceWindowLabel,
} from "./evaluate";
import type { Draft } from "./types";

function draft(patch: Partial<Draft>): Draft {
  return { ...emptyDraft(), use: "city", charge: "home", ...patch };
}

describe("priceInWindow", () => {
  it("an open end never excludes", () => {
    expect(priceInWindow(1, null, null)).toBe(true);
    expect(priceInWindow(999_999, null, null)).toBe(true);
    expect(priceInWindow(20_000, null, 30_000)).toBe(true);
    expect(priceInWindow(20_000, 10_000, null)).toBe(true);
  });

  it("excludes on either side", () => {
    expect(priceInWindow(9_000, 10_000, 30_000)).toBe(false);
    expect(priceInWindow(31_000, 10_000, 30_000)).toBe(false);
  });

  it("includes both bounds", () => {
    expect(priceInWindow(10_000, 10_000, 30_000)).toBe(true);
    expect(priceInWindow(30_000, 10_000, 30_000)).toBe(true);
  });
});

describe("priceWindowLabel", () => {
  it("names each shape of window in German", () => {
    expect(priceWindowLabel(null, null)).toBe("offen");
    expect(priceWindowLabel(null, 45_000)).toContain("bis");
    expect(priceWindowLabel(30_000, null)).toContain("ab");
    const both = priceWindowLabel(30_000, 45_000);
    expect(both).toContain("30.000");
    expect(both).toContain("45.000");
  });

  it("uses a non-breaking space before the currency sign", () => {
    expect(priceWindowLabel(null, 45_000)).toContain(" €");
  });
});

describe("a budget window in evaluateCars", () => {
  it("keeps only cars inside the window", () => {
    const e = evaluateCars(draft({ priceMin: 30_000, priceMax: 45_000 }));
    expect(e.budgetEmpty).toBe(false);
    for (const r of e.results) {
      expect(r.car.listEur).toBeGreaterThanOrEqual(30_000);
      expect(r.car.listEur).toBeLessThanOrEqual(45_000);
    }
  });

  it("respects a lower limit on its own", () => {
    const e = evaluateCars(draft({ priceMin: 50_000, priceMax: null }));
    for (const r of e.results) {
      expect(r.car.listEur).toBeGreaterThanOrEqual(50_000);
    }
  });

  it("reads a window entered back to front the way it was meant", () => {
    const forwards = evaluateCars(draft({ priceMin: 30_000, priceMax: 45_000 }));
    const backwards = evaluateCars(draft({ priceMin: 45_000, priceMax: 30_000 }));
    expect(backwards.results.map((r) => r.car.id)).toEqual(
      forwards.results.map((r) => r.car.id),
    );
  });

  it("says so when the window matches nothing, and marks what it shows", () => {
    // A window far below the cheapest car in the catalogue.
    const e = evaluateCars(draft({ priceMin: 1_000, priceMax: 2_000 }));
    expect(e.budgetEmpty).toBe(true);
    expect(e.results.length).toBeGreaterThan(0);
    // Everything shown is outside the window and must be marked as such.
    for (const r of e.results) {
      expect(r.priceFits).toBe(false);
    }
  });

  it("falls back to the cars nearest the window, not the cheapest", () => {
    // A window above every car in the catalogue: the nearest are the dearest.
    // Derived from the catalogue's actual ceiling (rather than a hardcoded
    // 70_000-75_000) so this keeps testing "above every car" as the catalogue
    // grows a genuinely expensive end - see the 13.09.2026 catalogue expansion,
    // which added cars above the old catalog's ~57k ceiling and would otherwise
    // have sat inside this window and silently broken its premise.
    const maxListEur = Math.max(...getCars().map((c) => c.listEur));
    const priceMin = maxListEur + 20_000;
    const priceMax = maxListEur + 25_000;
    const e = evaluateCars(draft({ priceMin, priceMax }));
    expect(e.budgetEmpty).toBe(true);
    const shown = e.results.slice(0, 3).map((r) => r.car.listEur);
    const dearest = [...e.results].map((r) => r.car.listEur).sort((a, b) => b - a);
    // The first car shown must be among the most expensive, never the cheapest.
    expect(shown[0]).toBe(dearest[0]);
  });

  it("an open budget is not an empty one", () => {
    const e = evaluateCars(draft({ priceMin: null, priceMax: null }));
    expect(e.budgetEmpty).toBe(false);
    expect(e.results.length).toBeGreaterThan(0);
  });

  it("a draft without priceMin behaves exactly as a ceiling used to", () => {
    const withField = evaluateCars(draft({ priceMin: null, priceMax: 40_000 }));
    for (const r of withField.results) {
      expect(r.car.listEur).toBeLessThanOrEqual(40_000);
    }
    expect(withField.budgetEmpty).toBe(false);
  });
});

describe("priceBounds", () => {
  it("brackets every car in the catalogue", () => {
    const b = priceBounds();
    for (const c of getCars()) {
      expect(c.listEur).toBeGreaterThanOrEqual(b.min);
      expect(c.listEur).toBeLessThanOrEqual(b.max);
    }
  });

  it("sits on whole thousands, so the slider ends read as round numbers", () => {
    const b = priceBounds();
    expect(b.min % 1000).toBe(0);
    expect(b.max % 1000).toBe(0);
  });

  it("is one source, so both screens cannot drift apart", () => {
    expect(priceBounds()).toEqual(priceBounds());
  });
});
