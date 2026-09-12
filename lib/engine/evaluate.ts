import carsJson from "@/data/cars.de.json";
import climateJson from "@/data/climate-months.de.json";
import routesJson from "@/data/routes.de.json";
import { BODY_CHIP, CHARGE_CHIP, MONTH_LABEL, USE_CHIP } from "@/lib/copy";
import { parseDeNumber } from "./parse";
import {
  computeRange,
  computeTripPlan,
  outdoorForMonth,
  tripPolyline,
} from "./range";
import type {
  Assumption,
  BodyStyle,
  Car,
  CarResult,
  ChargeOption,
  Draft,
  ResolvedInput,
  RouteDef,
  UseCase,
} from "./types";

// cars.de.json moved from a bare array to { meta, cars } so it can carry
// asOf/disclaimer/confidence at the file level (see CatalogMeta). Accept
// both shapes so an old cached copy of the file never breaks the build.
const cars = ((carsJson as { cars?: Car[] }).cars ??
  (carsJson as unknown as Car[])) as Car[];
const climate = climateJson as { months: Record<string, number> };
const routes = (routesJson as unknown as { routes: RouteDef[] }).routes;

const SPINE = routes.find((r) => r.id === "hamMuc")!;

export function getCars(): Car[] {
  return cars;
}

export function getRoute(id: string): RouteDef | null {
  return routes.find((r) => r.id === id) ?? null;
}

export function getRoutes(): RouteDef[] {
  return routes;
}

export function resolveDraft(draft: Draft): ResolvedInput {
  const useAssumed = draft.use === null;
  const use: UseCase = draft.use ?? "everyday";

  let dayKm = 50;
  let dayAssumed = true;
  if (draft.dayUnknown) {
    dayKm = 50;
    dayAssumed = true;
  } else {
    const parsed = parseDeNumber(draft.dayKm);
    if (parsed !== null && parsed > 0) {
      dayKm = parsed;
      dayAssumed = false;
    }
  }

  const bodies = Array.isArray(draft.bodies) ? draft.bodies : [];
  const bodiesAssumed = bodies.length === 0;

  // tripKm is passed through unchanged; tripActive (below) is the only gate.
  const tripKm = draft.tripKm;
  const tripActive = tripKm !== null && tripKm >= 80;

  const nowMonth = new Date().getMonth() + 1;
  const monthAssumed = draft.month === null;
  const month = draft.month ?? nowMonth;

  const chargeAssumed = draft.charge === null || draft.charge === "unknown";
  const charge: ChargeOption =
    draft.charge === null || draft.charge === "unknown" ? "public" : draft.charge;

  const priceMax =
    draft.priceMax !== null && draft.priceMax > 0 ? draft.priceMax : null;
  const priceAssumed = priceMax === null;

  return {
    use,
    useAssumed,
    dayKm,
    dayAssumed,
    bodies,
    bodiesAssumed,
    tripKm: draft.tripKm,
    tripActive,
    month,
    monthAssumed,
    charge,
    chargeAssumed,
    priceMax,
    priceAssumed,
    speedKph: draft.speedKph,
    startSoc: draft.startSoc,
    persons: draft.persons,
    outdoorC: outdoorForMonth(climate.months, month),
  };
}

export function budgetCap(priceMax: number | null): number | null {
  return priceMax !== null && priceMax > 0 ? priceMax : null;
}

export function buildAssumptions(r: ResolvedInput): Assumption[] {
  const bodyValue = r.bodiesAssumed
    ? "alle Formen"
    : r.bodies.map((b) => BODY_CHIP[b]).join(", ");

  const rows: Assumption[] = [
    {
      key: "use",
      label: "Nutzung",
      value: USE_CHIP[r.use],
      assumed: r.useAssumed,
    },
    {
      key: "day",
      label: "Normaler Tag",
      value: `${Math.round(r.dayKm)} km`,
      assumed: r.dayAssumed,
    },
    {
      key: "body",
      label: "Form",
      value: bodyValue,
      assumed: r.bodiesAssumed,
    },
    ...(r.tripKm !== null
      ? [
          {
            key: "trip",
            label: "Strecke",
            value: `${Math.round(r.tripKm)} km`,
            assumed: false,
          } satisfies Assumption,
        ]
      : []),
    // Month / Langstrecke only once Autobahn tool is in use
    ...(!r.monthAssumed || r.tripKm !== null
      ? [
          {
            key: "month",
            label: "Monat",
            value: MONTH_LABEL[r.month] ?? String(r.month),
            assumed: r.monthAssumed,
          } satisfies Assumption,
        ]
      : []),
    // Start SoC only once Autobahn tool is in use; default 100 % marked assumed
    ...(r.tripKm !== null
      ? [
          {
            key: "start",
            label: "Start",
            value: `${Math.round(r.startSoc * 100)} %`,
            assumed: r.startSoc === 1,
          } satisfies Assumption,
        ]
      : []),
    // Warm-battery assumption only when outdoor is cold (hide in mild/summer)
    ...(r.tripKm !== null && r.outdoorC < 10
      ? [
          {
            key: "precond",
            label: "DC-Laden",
            value: "Auto an der Säule schon warm",
            assumed: true,
          } satisfies Assumption,
        ]
      : []),
    {
      key: "charge",
      label: "Laden",
      value: CHARGE_CHIP[r.charge],
      assumed: r.chargeAssumed,
    },
    {
      key: "price",
      label: "Kaufpreis",
      value: r.priceAssumed
        ? "offen"
        : `bis ${Math.round(r.priceMax!).toLocaleString("de-DE")} €`,
      assumed: r.priceAssumed,
    },
  ];
  return rows;
}

function emptyTrip(rangeMid: number): import("./types").TripResult {
  return {
    active: false,
    tripKm: 0,
    rangeMid,
    needsStop: false,
    stops: [],
    driveMin: 0,
    chargeMin: 0,
    extraMin: 0,
    totalMin: 0,
    driveSpan: { low: 0, mid: 0, high: 0 },
    extraSpan: { low: 0, mid: 0, high: 0 },
    totalSpan: { low: 0, mid: 0, high: 0 },
    polyline: null,
  };
}

export function evaluateCars(draft: Draft): {
  resolved: ResolvedInput;
  assumptions: Assumption[];
  results: CarResult[];
} {
  const resolved = resolveDraft(draft);
  const assumptions = buildAssumptions(resolved);
  const cap = budgetCap(resolved.priceMax);

  const bodyFilter: BodyStyle[] | null =
    resolved.bodies.length > 0 ? resolved.bodies : null;

  const pool = bodyFilter
    ? cars.filter((c) => bodyFilter.includes(c.body))
    : cars;

  const results: CarResult[] = pool.map((car) => {
    const range = computeRange(
      car,
      resolved.outdoorC,
      resolved.speedKph,
      resolved.startSoc,
      resolved.persons,
    );

    let trip = emptyTrip(range.midKm);
    if (resolved.tripActive && resolved.tripKm !== null) {
      const plan = computeTripPlan(
        car,
        range.midKm,
        resolved.tripKm,
        resolved.speedKph,
        resolved.startSoc,
        range.lowKm,
        range.highKm,
        resolved.outdoorC,
      );
      const poly = tripPolyline(
        SPINE.polyline,
        resolved.tripKm,
        SPINE.km,
      );
      trip = {
        active: true,
        tripKm: resolved.tripKm,
        rangeMid: range.midKm,
        needsStop: plan.stops.length > 0,
        stops: plan.stops,
        driveMin: plan.driveMin,
        chargeMin: plan.chargeMin,
        extraMin: plan.extraMin,
        totalMin: plan.totalMin,
        driveSpan: plan.driveSpan,
        extraSpan: plan.extraSpan,
        totalSpan: plan.totalSpan,
        polyline: poly,
      };
    }

    const priceFits = cap === null ? true : car.listEur <= cap;
    const priceOutlier = resolved.priceAssumed && car.listEur > 55000;

    return { car, range, trip, priceFits, priceOutlier };
  });

  results.sort((a, b) => {
    if (a.priceFits !== b.priceFits) return a.priceFits ? -1 : 1;
    if (a.priceOutlier !== b.priceOutlier) return a.priceOutlier ? 1 : -1;
    // Soft preference: family → crossover (never hides explicit body picks)
    if (resolved.use === "family") {
      const aC = a.car.body === "crossover" ? 0 : 1;
      const bC = b.car.body === "crossover" ? 0 : 1;
      if (aC !== bC) return aC - bC;
    }
    if (resolved.use === "highway") {
      const d = b.range.midKm - a.range.midKm;
      if (d !== 0) return d;
    }
    if (resolved.use === "everyday" || resolved.dayKm <= 80) {
      const d = a.car.listEur - b.car.listEur;
      if (Math.abs(d) > 500) return d;
    }
    return b.range.midKm - a.range.midKm;
  });

  const filtered =
    cap !== null
      ? results.filter((r) => r.priceFits)
      : results.filter((r) => !r.priceOutlier || resolved.priceAssumed);

  const finalList = filtered.length > 0 ? filtered : results;

  return { resolved, assumptions, results: finalList };
}

export { cars, climate, routes };
