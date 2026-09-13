import { describe, expect, it } from "vitest";
import { formatCarName } from "./labels";
import { getCars } from "./evaluate";

/**
 * Changed 13.09.2026. This file used to assert that trim designations were
 * stripped — "Volkswagen ID.3 Pro" displayed as "Volkswagen ID.3" — which kept
 * names short at the cost of the one word that tells two battery sizes apart.
 * An ID.3 Pro and an ID.3 Pro S are different answers to the question this site
 * asks, and showing both as "ID.3" made the catalogue look like it listed the
 * same car twice.
 */
describe("formatCarName", () => {
  it("keeps the designation that distinguishes one variant from another", () => {
    expect(formatCarName({ brand: "Volkswagen", model: "ID.3 Pro" })).toBe(
      "Volkswagen ID.3 Pro",
    );
    expect(formatCarName({ brand: "Kia", model: "EV3 Long Range" })).toBe(
      "Kia EV3 Long Range",
    );
    expect(
      formatCarName({ brand: "Renault", model: "5 E-Tech Comfort Range" }),
    ).toBe("Renault 5 E-Tech Comfort Range");
  });

  it("does not invent or drop anything", () => {
    expect(formatCarName({ brand: "Opel", model: "Corsa Electric" })).toBe(
      "Opel Corsa Electric",
    );
  });

  it("tolerates stray whitespace in the catalogue", () => {
    expect(formatCarName({ brand: " BYD ", model: " Seal Design " })).toBe(
      "BYD Seal Design",
    );
  });
});

describe("the catalogue's own names", () => {
  it("never carries a battery size in the model name", () => {
    /* Four cars used to. The figure there was the GROSS pack while the card
       shows the usable one, so the same car appeared to have two different
       batteries. */
    for (const c of getCars()) {
      expect(c.model, c.id).not.toMatch(/\d+\s*kWh/i);
    }
  });

  it("gives every car a name of its own", () => {
    const names = getCars().map((c) => formatCarName(c));
    expect(new Set(names).size).toBe(names.length);
  });
});
