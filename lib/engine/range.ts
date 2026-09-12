import {
  OVERHEAD_MIN,
  STOP_ENERGY_FRAC,
  avgKwSpanForCar,
  tempFactorCharge,
} from "./charge";
import type { Car, MinSpan, RangeSpan, SpeedKph, TripStop } from "./types";

export { tempFactorCharge, avgKwSpanForCar, OVERHEAD_MIN } from "./charge";

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
  driveSpan: MinSpan;
  extraSpan: MinSpan;
  totalSpan: MinSpan;
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

/**
 * Cold air is denser, and at Autobahn speed most of the energy goes into pushing
 * it aside. Ideal gas at constant pressure: density scales with T_ref/T in
 * Kelvin, so 0.5 °C air is about 5 % denser than the 15 °C reference. Drag is
 * roughly three quarters of the energy at 130 km/h, so only that share is
 * affected.
 *
 * This is separate from tempFactor, which models cabin heating. Leaving it out
 * made every winter figure too optimistic by a few percent.
 */
export const DRAG_SHARE_AT_REF = 0.72;

export function airDensityFactor(outdoorC: number): number {
  const tRef = REF_TEMP_C + 273.15;
  const t = outdoorC + 273.15;
  if (t <= 0) return 1;
  const densityRatio = tRef / t;
  return 1 + DRAG_SHARE_AT_REF * (densityRatio - 1);
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
    airDensityFactor(outdoorC) *
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
  // rangeMid is from startSoc; assume default 0.9 if unknown (legacy callers).
  const { firstLeg } = tripLegs(rangeMid, 0.9);
  const needsStop = firstLeg < routeKm;
  const remainingKm = Math.round(rangeMid - routeKm);
  let stopAfterKm: number | null = null;
  if (needsStop) {
    stopAfterKm = Math.round(firstLeg);
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
 * Legs from SoC window (Ladekurve): range100 = rangeKm/startSoc,
 * first = range100*(startSoc-0.10), later = range100*0.70 (10→80).
 */
export function tripLegs(rangeKm: number, startSoc: number): {
  range100: number;
  firstLeg: number;
  laterLeg: number;
} {
  const soc = Math.max(0.15, Math.min(1, startSoc));
  const range100 = rangeKm / soc;
  return {
    range100,
    firstLeg: Math.max(1, range100 * (soc - 0.1)),
    laterLeg: Math.max(1, range100 * 0.7),
  };
}

function spanOf(low: number, mid: number, high: number): MinSpan {
  const a = Math.round(Math.min(low, mid, high));
  const c = Math.round(Math.max(low, mid, high));
  return { low: a, mid: Math.round(mid), high: c };
}

function planAtRange(
  car: Car,
  rangeKm: number,
  tripKm: number,
  speedKph: number,
  startSoc: number,
  outdoorC = 15,
  avgKw = 0,
  preconditioned = true,
): Omit<TripPlan, "driveSpan" | "extraSpan" | "totalSpan"> {
  const { firstLeg, range100 } = tripLegs(rangeKm, startSoc);
  const fTemp = tempFactorCharge(outdoorC, preconditioned);
  const baseKw = avgKw > 0 ? avgKw : avgKwSpanForCar(car).mid;
  const avgKwEff = Math.max(1, baseKw * fTemp);
  const stops: TripStop[] = [];
  let covered = 0;
  let remaining = tripKm;
  let leg = firstLeg;

  /*
   * How much energy a kilometre costs, derived from the full-pack range so the
   * caller does not have to pass consumption in a second time.
   */
  const kwhPerKm = range100 > 0 ? car.usableKwh / range100 : 0;
  /* 10 -> 80 %: the fast part of the curve. Past 80 % the power collapses and
     waiting there costs far more minutes than the kilometres are worth. */
  const capKwh = car.usableKwh * STOP_ENERGY_FRAC;

  while (kwhPerKm > 0) {
    if (remaining <= leg + 0.5) break;
    covered += leg;
    remaining -= leg;

    /*
     * Charge for the road ahead, not a fixed slab of battery.
     *
     * We arrive at a stop on the 10 % reserve and want to reach the destination
     * still holding 10 %, so the energy to put in is exactly what the remaining
     * distance costs - capped at the 10 -> 80 % window. Charging the full 70 %
     * every time produced the absurd case this replaced: a 44-minute stop 12 km
     * from the destination.
     */
    const needKwh = remaining * kwhPerKm;
    const takeKwh = Math.min(needKwh, capKwh);
    const chargeOnly = (takeKwh / avgKwEff) * 60;
    const minutes = Math.round(chargeOnly + OVERHEAD_MIN);
    stops.push({ afterKm: Math.round(covered), minutes });

    /* The next leg is whatever was actually put in, not a fixed 70 % leg. */
    leg = Math.max(1, takeKwh / kwhPerKm);
  }

  const driveMin = (tripKm / Math.max(1, speedKph)) * 60;
  const chargeMin = stops.reduce((sum, s) => sum + (s.minutes - OVERHEAD_MIN), 0);
  const extraMin = chargeMin + stops.length * OVERHEAD_MIN;
  return {
    stops,
    driveMin: Math.round(driveMin),
    chargeMin: Math.round(chargeMin),
    extraMin: Math.round(extraMin),
    totalMin: Math.round(driveMin + extraMin),
    usableLeg: Math.round(firstLeg),
  };
}

export function computeTripPlan(
  car: Car,
  rangeMid: number,
  tripKm: number,
  speedKph: number,
  startSoc = 0.9,
  rangeLow?: number,
  rangeHigh?: number,
  outdoorC = 15,
  preconditioned = true,
): TripPlan {
  const kw = avgKwSpanForCar(car);
  const mid = planAtRange(
    car,
    rangeMid,
    tripKm,
    speedKph,
    startSoc,
    outdoorC,
    kw.mid,
    preconditioned,
  );
  const pessimistic = planAtRange(
    car,
    rangeLow ?? rangeMid * 0.88,
    tripKm,
    speedKph,
    startSoc,
    outdoorC,
    kw.low,
    preconditioned,
  );
  const optimistic = planAtRange(
    car,
    rangeHigh ?? rangeMid * 1.1,
    tripKm,
    speedKph,
    startSoc,
    outdoorC,
    kw.high,
    preconditioned,
  );
  const driveHigh = Math.round(mid.driveMin * 1.08);
  const driveLow = Math.round(mid.driveMin * 0.95);
  const extraLow = Math.min(optimistic.extraMin, Math.round(mid.extraMin * 0.9));
  const extraHigh = Math.max(pessimistic.extraMin, Math.round(mid.extraMin * 1.15));
  return {
    ...mid,
    driveSpan: spanOf(driveLow, mid.driveMin, driveHigh),
    extraSpan: spanOf(extraLow, mid.extraMin, extraHigh),
    totalSpan: spanOf(
      driveLow + extraLow,
      mid.totalMin,
      driveHigh + extraHigh,
    ),
  };
}

/** Point on a lat/lng polyline at geodesic distance `km` from the start. */
export function pointAtKm(
  polyline: [number, number][],
  km: number,
): [number, number] | null {
  if (polyline.length === 0) return null;
  if (polyline.length === 1 || km <= 0) return polyline[0]!;
  let acc = 0;
  for (let i = 1; i < polyline.length; i++) {
    const a = polyline[i - 1]!;
    const b = polyline[i]!;
    const seg = geodesicKm(a, b);
    if (acc + seg >= km) {
      const f = seg > 0 ? (km - acc) / seg : 0;
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    }
    acc += seg;
  }
  return polyline[polyline.length - 1]!;
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
