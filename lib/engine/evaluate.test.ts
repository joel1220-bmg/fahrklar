import { describe, expect, it } from "vitest";
import { buildAssumptions, evaluateCars, resolveDraft } from "./evaluate";
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

  it("empty bodies → all shapes assumed", () => {
    const r = resolveDraft(emptyDraft());
    expect(r.bodies).toEqual([]);
    expect(r.bodiesAssumed).toBe(true);
  });
});

describe("evaluateCars", () => {
  it("returns catalog results with range spans", () => {
    const draft = emptyDraft();
    draft.use = "city";
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
    draft.use = "city";
    const { results, assumptions } = evaluateCars(draft);
    expect(results[0]!.trip.active).toBe(false);
    expect(assumptions.some((a) => a.key === "trip")).toBe(false);
  });

  it("no trip when tripKm is null", () => {
    const draft = emptyDraft();
    draft.use = "longDistance";
    draft.tripKm = null;
    const { results, resolved } = evaluateCars(draft);
    expect(resolved.tripActive).toBe(false);
    for (const r of results) {
      expect(r.trip.active).toBe(false);
      expect(r.trip.polyline).toBeNull();
    }
  });

  it("filters catalog to selected bodies", () => {
    const draft = emptyDraft();
    draft.bodies = ["hatch"];
    const { results } = evaluateCars(draft);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.car.body === "hatch")).toBe(true);
  });

  it("multi body filter keeps only selected shapes", () => {
    const draft = emptyDraft();
    draft.bodies = ["sedan", "crossover"];
    const { results } = evaluateCars(draft);
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every((r) => r.car.body === "sedan" || r.car.body === "crossover"),
    ).toBe(true);
    expect(results.some((r) => r.car.body === "hatch")).toBe(false);
  });

  it("empty bodies keeps all shapes", () => {
    const draft = emptyDraft();
    const { results } = evaluateCars(draft);
    const bodies = new Set(results.map((r) => r.car.body));
    expect(bodies.has("hatch")).toBe(true);
    expect(bodies.has("compact")).toBe(true);
    expect(bodies.has("sedan")).toBe(true);
    expect(bodies.has("crossover")).toBe(true);
  });

  it("compact filter keeps only compact (ID.3, Born)", () => {
    const draft = emptyDraft();
    draft.bodies = ["compact"];
    const { results } = evaluateCars(draft);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.car.body === "compact")).toBe(true);
    const ids = new Set(results.map((r) => r.car.id));
    expect(ids.has("vw-id3")).toBe(true);
    expect(ids.has("cupra-born")).toBe(true);
    expect(ids.has("renault-5")).toBe(false);
    expect(ids.has("opel-corsa")).toBe(false);
    expect(ids.has("byd-dolphin")).toBe(false);
  });

  it("hatch + compact is a union", () => {
    const draft = emptyDraft();
    draft.bodies = ["hatch", "compact"];
    const { results } = evaluateCars(draft);
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every((r) => r.car.body === "hatch" || r.car.body === "compact"),
    ).toBe(true);
    const ids = new Set(results.map((r) => r.car.id));
    expect(ids.has("vw-id3")).toBe(true);
    expect(ids.has("renault-5")).toBe(true);
    expect(results.some((r) => r.car.body === "sedan")).toBe(false);
  });

  it("hatch filter excludes compact cars", () => {
    const draft = emptyDraft();
    draft.bodies = ["hatch"];
    const { results } = evaluateCars(draft);
    const ids = new Set(results.map((r) => r.car.id));
    expect(ids.has("renault-5")).toBe(true);
    expect(ids.has("opel-corsa")).toBe(true);
    expect(ids.has("byd-dolphin")).toBe(true);
    expect(ids.has("vw-id3")).toBe(false);
    expect(ids.has("cupra-born")).toBe(false);
  });
});

describe("buildAssumptions Autobahn gating", () => {
  it("omits month until Autobahn tool is in use", () => {
    const draft = emptyDraft();
    const { assumptions } = evaluateCars(draft);
    expect(assumptions.some((a) => a.key === "month")).toBe(false);
    expect(assumptions.some((a) => a.key === "body" && a.assumed)).toBe(true);
  });

  it("includes month when month touched", () => {
    const draft = emptyDraft();
    draft.month = 3;
    const a = buildAssumptions(resolveDraft(draft));
    expect(a.some((x) => x.key === "month" && !x.assumed)).toBe(true);
  });

  it("includes month when tripKm set (even if month assumed)", () => {
    const draft = emptyDraft();
    draft.tripKm = 400;
    const a = buildAssumptions(resolveDraft(draft));
    expect(a.some((x) => x.key === "month" && x.assumed)).toBe(true);
  });

  it("body eingegeben when selected", () => {
    const draft = emptyDraft();
    draft.bodies = ["hatch", "sedan"];
    const a = buildAssumptions(resolveDraft(draft));
    const body = a.find((x) => x.key === "body");
    expect(body?.assumed).toBe(false);
    expect(body?.value).toContain("Kleinwagen");
    expect(body?.value).toContain("Limousine");
  });

  it("omits Start until Autobahn tool is in use", () => {
    const draft = emptyDraft();
    const a = buildAssumptions(resolveDraft(draft));
    expect(a.some((x) => x.key === "start")).toBe(false);
  });

  it("includes Start when tripKm set; default 100 % marked assumed", () => {
    const draft = emptyDraft();
    draft.tripKm = 400;
    const a = buildAssumptions(resolveDraft(draft));
    const start = a.find((x) => x.key === "start");
    expect(start).toEqual({
      key: "start",
      label: "Start",
      value: "100 %",
      assumed: true,
    });
  });

  it("Start 90 % is not assumed", () => {
    const draft = emptyDraft();
    draft.tripKm = 400;
    draft.startSoc = 0.9;
    const a = buildAssumptions(resolveDraft(draft));
    const start = a.find((x) => x.key === "start");
    expect(start?.value).toBe("90 %");
    expect(start?.assumed).toBe(false);
  });

  it("includes warm-battery assumption when tripKm set and outdoorC < 10", () => {
    const draft = emptyDraft();
    draft.tripKm = 400;
    draft.month = 1;
    const a = buildAssumptions(resolveDraft(draft));
    const pre = a.find((x) => x.key === "precond");
    expect(pre).toEqual({
      key: "precond",
      label: "DC-Laden",
      value: "Auto an der Säule schon warm",
      assumed: true,
    });
  });

  it("omits warm-battery assumption in mild/summer months", () => {
    const draft = emptyDraft();
    draft.tripKm = 400;
    draft.month = 7;
    const a = buildAssumptions(resolveDraft(draft));
    expect(a.some((x) => x.key === "precond")).toBe(false);
  });
});

describe("Kauf-Lotse Autobahn 140 km/h / 450 km (Seal / ID.7 / M3)", () => {
  /**
   * Lock: "Seal 1, ID.7 2" is ONLY January (−0.5 °C) + full start (100 %).
   * At 15 °C + 90 % start the engine correctly gives Seal 1, ID.7 1, Model 3 2.
   * Do NOT fudge consumption / Ladezeit formulas.
   */
  async function stopsAt(
    outdoorC: number,
    startSoc: number,
  ): Promise<Record<string, { rangeMid: number; stops: number }>> {
    const { computeRange, computeTripPlan } = await import("./range");
    const { getCars } = await import("./evaluate");
    const cars = getCars();
    const speed = 140 as const;
    const tripKm = 450;
    const persons = 2;
    const out: Record<string, { rangeMid: number; stops: number }> = {};
    for (const id of ["byd-seal", "vw-id7", "tesla-m3"]) {
      const car = cars.find((c) => c.id === id);
      expect(car, `missing ${id}`).toBeTruthy();
      const range = computeRange(car!, outdoorC, speed, startSoc, persons);
      const plan = computeTripPlan(
        car!,
        range.midKm,
        tripKm,
        speed,
        startSoc,
        range.lowKm,
        range.highKm,
        outdoorC,
      );
      out[id] = { rangeMid: range.midKm, stops: plan.stops.length };
    }
    return out;
  }

  it("15 °C, startSoc 0.9: Seal 1, ID.7 1, Model 3 1 (SoC-window legs)", async () => {
    const r = await stopsAt(15, 0.9);
    expect(r["byd-seal"]).toEqual({ rangeMid: 388, stops: 1 });
    expect(r["vw-id7"]).toEqual({ rangeMid: 346, stops: 1 });
    expect(r["tesla-m3"]).toEqual({ rangeMid: 297, stops: 1 });
  });

  it("January −0.5 °C, startSoc 1.0: Seal 1, ID.7 1, Model 3 2", async () => {
    const { outdoorForMonth } = await import("./range");
    const { climate } = await import("./evaluate");
    const outdoorC = outdoorForMonth(climate.months, 1);
    expect(outdoorC).toBe(-0.5);

    const r = await stopsAt(outdoorC, 1.0);
    // Engine actual at January / full start (assert, do not fudge)
    expect(r["byd-seal"]!.stops).toBe(1);
    expect(r["vw-id7"]!.stops).toBe(1);
    expect(r["tesla-m3"]!.stops).toBe(2);
  });

  it("evaluateCars month 1 + startSoc 1 matches January stop counts", () => {
    const draft = emptyDraft();
    draft.tripKm = 450;
    draft.month = 1;
    draft.speedKph = 140;
    draft.startSoc = 1;
    const { results, resolved } = evaluateCars(draft);
    expect(resolved.outdoorC).toBe(-0.5);
    const byId = (id: string) => results.find((x) => x.car.id === id)!;
    expect(byId("byd-seal").trip.stops.length).toBe(1);
    expect(byId("vw-id7").trip.stops.length).toBe(1);
    expect(byId("tesla-m3").trip.stops.length).toBe(2);
  });
});
