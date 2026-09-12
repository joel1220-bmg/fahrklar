import type { Car, RangeSpan, SpeedKph, TripStop } from "./types";

const REF_TEMP_C = 15;
const REF_SPEED = 130;

export type TripCore = {
  routeKm: number;
  rangeMid: number;
  needsStop: boolean;
  remainingKm: number;
  stopAfterKm: number | null;
};

export type TripPlan = {
  stops: TripStop[];
  driveMin: number;
  chargeMin: number;
  extraMin: number;
  totalMin: number;
  usableLeg: number;
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

export function speedFactor(speedKph: number): number {
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
  speedKph: number,
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

/** Legacy single-stop check (kept for older tests / callers). */
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

/**
 * Multi-stop Autobahn trip plan for a flexible tripKm.
 * usableLeg = rangeMid * 0.75; DC stops every usableLeg until remaining < usableLeg.
 * Each stop: energy = usableKwh * 0.7 (10–80%), avg = dcPeakKw * 0.55,
 * charge minutes = energy/avg*60; +8 min overhead per stop in extra time.
 */
export function computeTripPlan(
  car: Car,
  rangeMid: number,
  tripKm: number,
  speedKph: number,
): TripPlan {
  const usableLeg = Math.max(1, rangeMid * 0.75);
  const stops: TripStop[] = [];
  let covered = 0;
  let remaining = tripKm;

  while (remaining > usableLeg + 0.5) {
    covered += usableLeg;
    const energy = car.usableKwh * 0.7;
    const avgPower = Math.max(1, car.dcPeakKw * 0.55);
    const chargeOnly = (energy / avgPower) * 60;
    const minutes = Math.round(chargeOnly + 8);
    stops.push({
      afterKm: Math.round(covered),
      minutes,
    });
    remaining -= usableLeg;
  }

  const driveMin = (tripKm / Math.max(1, speedKph)) * 60;
  const chargeMin = stops.reduce((sum, s) => sum + (s.minutes - 8), 0);
  const extraMin = chargeMin + stops.length * 8;
  const totalMin = driveMin + extraMin;

  return {
    stops,
    driveMin: Math.round(driveMin),
    chargeMin: Math.round(chargeMin),
    extraMin: Math.round(extraMin),
    totalMin: Math.round(totalMin),
    usableLeg: Math.round(usableLeg),
  };
}

export function outdoorForMonth(months: Record<string, number>, month: number): number {
  const key = String(Math.max(1, Math.min(12, month)));
  return months[key] ?? 10;
}

/** Haversine distance in km between two [lat, lng] points. */
export function geodesicKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Build a north–south DE corridor polyline of approximately tripKm
 * along the Hamburg→München spine (prefix of the route).
 */
export function tripPolyline(
  spine: [number, number][],
  tripKm: number,
  spineRouteKm: number,
): [number, number][] {
  if (spine.length < 2 || tripKm <= 0) return spine.slice(0, 1);

  // Cumulative geodesic lengths along spine
  const segs: number[] = [0];
  for (let i = 1; i < spine.length; i++) {
    segs.push(segs[i - 1]! + geodesicKm(spine[i - 1]!, spine[i]!));
  }
  const geoTotal = segs[segs.length - 1]!;
  // Scale so spine covers spineRouteKm (catalog distance), not pure geodesic
  const scale = geoTotal > 0 ? spineRouteKm / geoTotal : 1;
  const target = Math.min(tripKm, spineRouteKm);

  const out: [number, number][] = [spine[0]!];
  for (let i = 1; i < spine.length; i++) {
    const scaled = segs[i]! * scale;
    if (scaled <= target) {
      out.push(spine[i]!);
      if (scaled >= target - 0.5) break;
    } else {
      // Interpolate last segment to hit target
      const prevScaled = segs[i - 1]! * scale;
      const frac = (target - prevScaled) / Math.max(0.001, scaled - prevScaled);
      const a = spine[i - 1]!;
      const b = spine[i]!;
      out.push([
        a[0] + (b[0] - a[0]) * frac,
        a[1] + (b[1] - a[1]) * frac,
      ]);
      break;
    }
  }
  return out;
}
