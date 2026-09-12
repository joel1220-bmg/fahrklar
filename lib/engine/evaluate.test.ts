import { describe, expect, it } from "vitest";
import { evaluateCars, resolveDraft } from "./evaluate";
import { emptyDraft } from "./types";

describe("resolveDraft defaults", () => {
  it("empty day → 50 km assumed", () => {
    const r = resolveDraft(emptyDraft());
    expect(r.dayKm).toBe(50);
    expect(r.dayAssumed).toBe(true);
  });

  it("empty trip → not active", () => {
    const r = resolveDraft(emptyDraft());
    expect(r.tripKm).toBeNull();
    expect(r.tripActive).toBe(false);
  });

  it("tripKm >= 80 activates trip", () => {
    const d = emptyDraft();
    d.tripKm = 300;
    const r = resolveDraft(d);
    expect(r.tripActive).toBe(true);
  });

  it("tripKm below 80 stays inactive", () => {
    const d = emptyDraft();
    d.tripKm = 50;
    const r = resolveDraft(d);
    expect(r.tripActive).toBe(false);
  });

  it("empty charge → public assumed", () => {
    const r = resolveDraft(emptyDraft());
    expect(r.charge).toBe("public");
    expect(r.chargeAssumed).toBe(true);
  });

  it("empty month → current month", () => {
    const r = resolveDraft(emptyDraft());
    expect(r.month).toBe(new Date().getMonth() + 1);
    expect(r.monthAssumed).toBe(true);
  });

  it("default speed is 120", () => {
    expect(emptyDraft().speedKph).toBe(120);
  });
});

describe("evaluateCars", () => {
  it("returns catalog results with range spans", () => {
    const draft = emptyDraft();
    draft.use = "everyday";
    draft.dayKm = "40";
    draft.tripKm = 300;
    draft.month = 1;
    draft.charge = "home";
    draft.priceMax = 45000;
    const { results, assumptions } = evaluateCars(draft);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]!.range.lowKm).toBeLessThanOrEqual(results[0]!.range.highKm);
    expect(assumptions.some((a) => a.key === "day" && !a.assumed)).toBe(true);
    expect(assumptions.some((a) => a.key === "trip")).toBe(true);
    expect(results[0]!.trip.active).toBe(true);
    expect(results[0]!.trip.polyline).not.toBeNull();
  });

  it("no tripKm → trip inactive, no Strecke assumption", () => {
    const draft = emptyDraft();
    draft.use = "everyday";
    const { results, assumptions } = evaluateCars(draft);
    expect(results[0]!.trip.active).toBe(false);
    expect(assumptions.some((a) => a.key === "trip")).toBe(false);
  });
});
