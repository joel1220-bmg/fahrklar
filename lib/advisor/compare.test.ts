import { describe, expect, it } from "vitest";
import { sortForCompare } from "./compare";
import type { CarResult, TripResult } from "@/lib/engine/types";

function fake(id: string, stops: number, totalMid: number): CarResult {
  const trip: TripResult = {
    active: true,
    tripKm: 450,
    rangeMid: 300,
    needsStop: stops > 0,
    stops: Array.from({ length: stops }, (_, i) => ({
      afterKm: (i + 1) * 200,
      minutes: 30,
    })),
    driveMin: 200,
    chargeMin: stops * 20,
    extraMin: stops * 28,
    totalMin: totalMid,
    driveSpan: { low: 190, mid: 200, high: 210 },
    extraSpan: { low: stops * 20, mid: stops * 28, high: stops * 35 },
    totalSpan: { low: totalMid - 10, mid: totalMid, high: totalMid + 15 },
    polyline: null,
  };
  return {
    car: {
      id,
      brand: id,
      model: id,
      body: "sedan",
      seats: 5,
      listEur: 40000,
      usableKwh: 60,
      wltpKm: 400,
      highwayKwhPer100: 17,
      dcPeakKw: 150,
      heatPump: true,
      colorHex: "#000",
      asOf: "2026-09-12",
    },
    range: {
      lowKm: 250,
      midKm: 300,
      highKm: 330,
      outdoorC: 15,
      speedKph: 140,
      kwhPer100: 17,
    },
    trip,
    priceFits: true,
    priceOutlier: false,
  };
}

describe("sortForCompare", () => {
  it("orders by fewest stops, then shortest total mid", () => {
    const a = fake("a", 2, 300);
    const b = fake("b", 1, 320);
    const c = fake("c", 2, 280);
    const sorted = sortForCompare([a, b, c]);
    expect(sorted.map((r) => r.car.id)).toEqual(["b", "c", "a"]);
  });
});
