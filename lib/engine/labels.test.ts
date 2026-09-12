import { describe, expect, it } from "vitest";
import { formatCarName } from "./labels";

describe("formatCarName", () => {
  it("strips Comfort Range and E-Tech (Renault 5)", () => {
    expect(
      formatCarName({ brand: "Renault", model: "5 E-Tech Comfort Range" }),
    ).toBe("Renault 5");
  });

  it("strips Pro, Long Range, Design, RWD", () => {
    expect(formatCarName({ brand: "Volkswagen", model: "ID.3 Pro" })).toBe(
      "Volkswagen ID.3",
    );
    expect(formatCarName({ brand: "Kia", model: "EV3 Long Range" })).toBe(
      "Kia EV3",
    );
    expect(formatCarName({ brand: "BYD", model: "Seal Design" })).toBe(
      "BYD Seal",
    );
    expect(formatCarName({ brand: "Tesla", model: "Model 3 RWD" })).toBe(
      "Tesla Model 3",
    );
  });

  it("does not invent a marketing name when nothing to strip", () => {
    expect(formatCarName({ brand: "Opel", model: "Corsa Electric" })).toBe(
      "Opel Corsa Electric",
    );
  });
});
