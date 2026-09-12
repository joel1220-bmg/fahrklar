import carsJson from "@/data/cars.de.json";
import climateJson from "@/data/climate-months.de.json";
import routesJson from "@/data/routes.de.json";
import { CHARGE_CHIP, LONG_CHIP, MONTH_LABEL, PRICE_CHIP, USE_CHIP } from "@/lib/copy";
import { parseDeNumber } from "./parse";
import { computeRange, computeTrip, outdoorForMonth } from "./range";
import type {
  Assumption,
  Car,
  CarResult,
  ChargeOption,
  Draft,
  LongTrip,
  PriceOption,
  ResolvedInput,
  RouteDef,
  UseCase,
} from "./types";

const cars = carsJson as Car[];
const climate = climateJson as { months: Record<string, number> };
const routes = (routesJson as unknown as { routes: RouteDef[] }).routes;

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

  const longAssumed = draft.longTrip === null;
  const longTrip: LongTrip = draft.longTrip ?? "none";

  const nowMonth = new Date().getMonth() + 1;
  const monthAssumed = draft.month === null;
  const month = draft.month ?? nowMonth;

  const chargeAssumed = draft.charge === null || draft.charge === "unknown";
  const charge: ChargeOption =
    draft.charge === null || draft.charge === "unknown" ? "public" : draft.charge;

  const priceAssumed = draft.price === null || draft.price === "unknown";
  const price: PriceOption =
    draft.price === null || draft.price === "unknown" ? "unknown" : draft.price;

  let route: RouteDef | null = null;
  if (longTrip === "hamMuc" || longTrip === "berCgn" || longTrip === "strBer") {
    route = getRoute(longTrip);
  }

  return {
    use,
    useAssumed,
    dayKm,
    dayAssumed,
    longTrip,
    longAssumed: longAssumed || longTrip === "unknown",
    month,
    monthAssumed,
    charge,
    chargeAssumed,
    price,
    priceAssumed,
    speedKph: draft.speedKph,
    startSoc: draft.startSoc,
    persons: draft.persons,
    outdoorC: outdoorForMonth(climate.months, month),
    route,
  };
}

export function budgetCap(price: PriceOption): number | null {
  switch (price) {
    case "to35":
      return 35000;
    case "to45":
      return 45000;
    case "to60":
      return 60000;
    case "over":
      return null;
    case "unknown":
      return null;
  }
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
    {
      key: "long",
      label: "Langstrecke",
      value:
        r.longTrip === "unknown"
          ? LONG_CHIP.unknown
          : r.longTrip === "none"
            ? LONG_CHIP.none
            : LONG_CHIP[r.longTrip],
      assumed: r.longAssumed,
    },
    {
      key: "month",
      label: "Monat",
      value: MONTH_LABEL[r.month] ?? String(r.month),
      assumed: r.monthAssumed,
    },
    {
      key: "charge",
      label: "Laden",
      value: CHARGE_CHIP[r.charge === "public" && r.chargeAssumed ? "public" : r.charge],
      assumed: r.chargeAssumed,
    },
    {
      key: "price",
      label: "Kaufpreis",
      value: r.priceAssumed
        ? PRICE_CHIP.unknown
        : PRICE_CHIP[r.price as Exclude<PriceOption, "unknown">] ?? PRICE_CHIP.unknown,
      assumed: r.priceAssumed,
    },
  ];
  return rows;
}

function emptyTrip(rangeMid: number): import("./types").TripResult {
  return {
    active: false,
    routeId: null,
    routeName: null,
    routeKm: 0,
    rangeMid,
    needsStop: false,
    remainingKm: rangeMid,
    stopAfterKm: null,
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
  const cap = budgetCap(resolved.price);

  const results: CarResult[] = cars.map((car) => {
    const range = computeRange(
      car,
      resolved.outdoorC,
      resolved.speedKph,
      resolved.startSoc,
      resolved.persons,
    );

    let trip = emptyTrip(range.midKm);
    if (resolved.route) {
      const t = computeTrip(range.midKm, resolved.route.km);
      trip = {
        active: true,
        routeId: resolved.route.id,
        routeName: resolved.route.name,
        routeKm: resolved.route.km,
        rangeMid: t.rangeMid,
        needsStop: t.needsStop,
        remainingKm: t.remainingKm,
        stopAfterKm: t.stopAfterKm,
        polyline: resolved.route.polyline,
      };
    }

    const priceFits = cap === null ? true : car.listEur <= cap;
    const priceOutlier = resolved.priceAssumed && car.listEur > 55000;

    return { car, range, trip, priceFits, priceOutlier };
  });

  // Prefer fitting budget; then highway mid range; then list price
  results.sort((a, b) => {
    if (a.priceFits !== b.priceFits) return a.priceFits ? -1 : 1;
    if (a.priceOutlier !== b.priceOutlier) return a.priceOutlier ? 1 : -1;
    // family → prefer seats (all 5 here); highway use → prefer range
    if (resolved.use === "highway") {
      const d = b.range.midKm - a.range.midKm;
      if (d !== 0) return d;
    }
    if (resolved.use === "everyday" || resolved.dayKm <= 80) {
      // prefer efficient / smaller list among fits
      const d = a.car.listEur - b.car.listEur;
      if (Math.abs(d) > 500) return d;
    }
    return b.range.midKm - a.range.midKm;
  });

  const filtered =
    cap !== null ? results.filter((r) => r.priceFits) : results.filter((r) => !r.priceOutlier || resolved.priceAssumed);

  // If budget filter emptied catalog, fall back to all with mark
  const finalList = filtered.length > 0 ? filtered : results;

  return { resolved, assumptions, results: finalList };
}

export { cars, climate, routes };
