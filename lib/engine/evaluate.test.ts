import { describe, expect, it } from "vitest";
import { evaluateCars, resolveDraft } from "./evaluate";
import { emptyDraft } from "./types";

describe("resolveDraft defaults", () => {
  it("empty day → 50 km assumed", () => {
    const r = resolveDraft(emptyDraft());
    expect(r.dayKm).toBe(50);
    expect(r.dayAssumed).toBe(true);
  });

  it("empty long → none (no route)", () => {
    const r = resolveDraft(emptyDraft());
    expect(r.longTrip).toBe("none");
    expect(r.route).toBeNull();
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
});

describe("evaluateCars", () => {
  it("returns catalog results with range spans", () => {
    const draft = emptyDraft();
    draft.use = "everyday";
    draft.dayKm = "40";
    draft.longTrip = "hamMuc";
    draft.month = 1;
    draft.charge = "home";
    draft.price = "to45";
    const { results, assumptions } = evaluateCars(draft);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]!.range.lowKm).toBeLessThanOrEqual(results[0]!.range.highKm);
    expect(assumptions.some((a) => a.key === "day" && !a.assumed)).toBe(true);
    expect(results[0]!.trip.active).toBe(true);
  });
});
