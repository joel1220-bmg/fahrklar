import type { Car, RangeSpan, SpeedKph } from "./types";

const REF_TEMP_C = 15;
const REF_SPEED: SpeedKph = 130;

export type TripCore = {
  routeKm: number;
  rangeMid: number;
  needsStop: boolean;
  remainingKm: number;
  stopAfterKm: number | null;
};

/** Cabin heat load factor vs heatPump / PTC at outdoor °C relative to 15 °C. */
export function tempFactor(outdoorC: number, heatPump: boolean): number {
  const delta = REF_TEMP_C - outdoorC;
  if (delta <= 0) {
    const warm = outdoorC - 22;
    if (warm <= 0) return 1;
    return 1 + Math.min(0.08, warm * 0.01);
  }
  const perDegree = heatPump ? 0.012 : 0.022;
  return 1 + delta * perDegree;
}

export function speedFactor(speedKph: SpeedKph): number {
  const ratio = speedKph / REF_SPEED;
  return Math.pow(ratio, 1.6);
}

export function personsFactor(persons: number): number {
  const p = Math.max(1, Math.min(7, persons));
  return 1 + (p - 2) * 0.015;
}

export function highwayConsumption(
  car: Car,
  outdoorC: number,
  speedKph: SpeedKph,
  persons: number,
): number {
  return (
    car.highwayKwhPer100 *
    tempFactor(outdoorC, car.heatPump) *
    speedFactor(speedKph) *
    personsFactor(persons)
  );
}

export function computeRange(
  car: Car,
  outdoorC: number,
  speedKph: SpeedKph,
  startSoc: number,
  persons: number,
): RangeSpan {
  const soc = Math.max(0.1, Math.min(1, startSoc));
  const kwhPer100 = highwayConsumption(car, outdoorC, speedKph, persons);
  const usable = car.usableKwh * soc;
  const midKm = (usable / kwhPer100) * 100;
  const lowKm = midKm * 0.88;
  const highKm = midKm * 1.1;
  return {
    lowKm: Math.round(lowKm),
    midKm: Math.round(midKm),
    highKm: Math.round(highKm),
    outdoorC,
    speedKph,
    kwhPer100: Math.round(kwhPer100 * 10) / 10,
  };
}

/** Trip needs a DC stop if rangeMid * 0.85 < routeKm (buffer). */
export function computeTrip(rangeMid: number, routeKm: number): TripCore {
  const needsStop = rangeMid * 0.85 < routeKm;
  const remainingKm = Math.round(rangeMid - routeKm);
  let stopAfterKm: number | null = null;
  if (needsStop) {
    stopAfterKm = Math.round(rangeMid * 0.7);
  }
  return {
    routeKm,
    rangeMid,
    needsStop,
    remainingKm,
    stopAfterKm,
  };
}

export function outdoorForMonth(months: Record<string, number>, month: number): number {
  const key = String(Math.max(1, Math.min(12, month)));
  return months[key] ?? 10;
}
