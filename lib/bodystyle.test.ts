/**
 * A body style only exists once every consumer knows it.
 *
 * `CLAUDE.md` records what happens otherwise: "compact" was added to the union
 * and to the catalogue while the generator still produced three models, and the
 * build died. "kombi" was added on 13.09.2026, so this file walks the whole
 * chain rather than trusting that it was remembered.
 */

import { describe, expect, it } from "vitest";
import dims from "@/public/models/dims.json";
import { BODY_CHIP } from "./copy";
import { getCars } from "./engine/evaluate";
import { emptyDraft, type BodyStyle } from "./engine/types";
import { evaluateCars } from "./engine/evaluate";
import { draftSchema } from "./schema";

const STYLES: BodyStyle[] = ["hatch", "compact", "kombi", "sedan", "crossover"];

describe("every body style is known all the way down", () => {
  it("has a German label", () => {
    for (const b of STYLES) {
      expect(BODY_CHIP[b]).toBeTruthy();
    }
    expect(Object.keys(BODY_CHIP).sort()).toEqual([...STYLES].sort());
  });

  it("has generated dimensions", () => {
    for (const b of STYLES) {
      const d = (dims as Record<string, { L: number; W: number; H: number }>)[b];
      expect(d, `dims.json is missing ${b}`).toBeDefined();
      expect(d!.L).toBeGreaterThan(3);
      expect(d!.H).toBeGreaterThan(1);
    }
  });

  it("keeps the catalogue inside the union", () => {
    for (const car of getCars()) {
      expect(STYLES).toContain(car.body);
    }
  });
});

describe("Kombi", () => {
  it("is offered with more than a single car behind it", () => {
    const kombis = getCars().filter((c) => c.body === "kombi");
    // A filter that returns one car is a dead end, not a choice.
    expect(kombis.length).toBeGreaterThanOrEqual(3);
  });

  it("is longer and lower than the hatch it is not", () => {
    const d = dims as Record<string, { L: number; W: number; H: number }>;
    expect(d.kombi!.L).toBeGreaterThan(d.hatch!.L);
    expect(d.kombi!.H).toBeLessThan(d.hatch!.H);
  });

  it("filters the result list down to estates when chosen", () => {
    const e = evaluateCars({ ...emptyDraft(), use: "city", charge: "home", bodies: ["kombi"] });
    expect(e.results.length).toBeGreaterThan(0);
    for (const r of e.results) {
      expect(r.car.body).toBe("kombi");
    }
  });

  it("survives saved-draft validation", () => {
    /* The zod enum is a plain list of strings, so the compiler never compares
       it with BodyStyle. This assertion is the only thing that would have
       caught the schema being left behind. */
    const parsed = draftSchema.safeParse({ ...emptyDraft(), bodies: ["kombi", "sedan"] });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.bodies).toContain("kombi");
  });

  it("guards every other style against the same omission", () => {
    for (const b of STYLES) {
      const parsed = draftSchema.safeParse({ ...emptyDraft(), bodies: [b] });
      expect(parsed.success, `schema rejects ${b}`).toBe(true);
    }
  });
});
