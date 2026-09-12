import carsJson from "@/data/cars.de.json";
import climateJson from "@/data/climate-months.de.json";
import routesJson from "@/data/routes.de.json";
import { CHARGE_CHIP, MONTH_LABEL, USE_CHIP } from "@/lib/copy";
import { parseDeNumber } from "./parse";
import {
  computeRange,
  computeTripPlan,
  outdoorForMonth,
  tripPolyline,
} from "./range";
import type {
  Assumption,
  Car,
  CarResult,
  ChargeOption,
  Draft,
  ResolvedInput,
  RouteDef,
  UseCase,
} from "./types";

const cars = carsJson as Car[];
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

  const tripKm =
    draft.tripKm !== null && draft.tripKm >= 80 ? draft.tripKm : draft.tripKm;
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
    {
      key: "month",
      label: "Monat",
      value: MONTH_LABEL[r.month] ?? String(r.month),
      assumed: r.monthAssumed,
    },
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

  const results: CarResult[] = cars.map((car) => {
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
