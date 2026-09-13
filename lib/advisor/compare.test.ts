import { describe, expect, it } from "vitest";
import { tripTotalMid } from "./compare";
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
    cityRange: {
      lowKm: 330,
      midKm: 400,
      highKm: 470,
      kwhPer100: 13,
      outdoorC: 15,
    },
    trip,
    priceFits: true,
    priceOutlier: false,
  };
}

describe("tripTotalMid", () => {
  it("reads the middle of the total span", () => {
    expect(tripTotalMid(fake("a", 2, 300))).toBe(300);
    expect(tripTotalMid(fake("b", 0, 275))).toBe(275);
  });
});
