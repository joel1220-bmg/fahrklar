import { describe, expect, it } from "vitest";
import { formatDeNumber, formatEUR, parseDeNumber } from "./parse";

describe("parseDeNumber", () => {
  it("parses plain integers", () => {
    expect(parseDeNumber("50")).toBe(50);
    expect(parseDeNumber(120)).toBe(120);
  });

  it("parses DE thousands with dot", () => {
    expect(parseDeNumber("1.200")).toBe(1200);
    expect(parseDeNumber("35.000")).toBe(35000);
  });

  it("parses DE decimals with comma", () => {
    expect(parseDeNumber("18,5")).toBe(18.5);
  });

  it("parses mixed DE currency-ish", () => {
    expect(parseDeNumber("45.990 €")).toBe(45990);
  });

  it("returns null for empty", () => {
    expect(parseDeNumber("")).toBeNull();
    expect(parseDeNumber(null)).toBeNull();
    expect(parseDeNumber("–")).toBeNull();
  });
});

describe("formatDeNumber", () => {
  it("formats DE", () => {
    expect(formatDeNumber(1234)).toBe("1.234");
    expect(formatEUR(41990)).toContain("41.990");
  });
});
