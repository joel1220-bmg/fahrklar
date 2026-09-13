import carsJson from "@/data/cars.de.json";
import climateJson from "@/data/climate-months.de.json";
import routesJson from "@/data/routes.de.json";
import { BODY_CHIP, CHARGE_CHIP, MONTH_LABEL, USE_CHIP } from "@/lib/copy";
import { parseDeNumber } from "./parse";
import {
  computeCityRange,
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

/*
 * The sketch corridor the map draws on. Deliberately not one of the named
 * routes: Hamburg-Muenchen is 790 km, the trip slider offered 900, and
 * tripPolyline clamps to the corridor - so every trip past 790 km drew the
 * identical line and the route stopped growing. The corridor now runs the
 * length of the country, and tripMaxKm() below keeps the slider from ever
 * again promising a distance the map cannot draw.
 */
const SPINE = routes.find((r) => r.id === "spineDe")!;

/** Longest trip the sketch corridor can actually show, in whole tens of km. */
export function tripMaxKm(): number {
  return Math.floor(SPINE.km / 10) * 10;
}

/**
 * Slider stops for any budget control, derived from the catalogue rather than
 * typed into each screen. The intake form and the control bar used to carry
 * their own hardcoded pairs (28.000-75.000 and 25.000-90.000), so a budget set
 * on one screen could not be expressed on the other, and neither covered the
 * catalogue after it doubled. Rounded outward to whole thousands so the ends
 * are readable numbers rather than a car's exact list price.
 */
export function priceBounds(): { min: number; max: number } {
  const prices = cars.map((c) => c.listEur);
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  return {
    min: Math.floor(lo / 1000) * 1000,
    max: Math.ceil(hi / 1000) * 1000,
  };
}

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
  const use: UseCase = draft.use ?? "city";

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

  const rawMax =
    draft.priceMax !== null && draft.priceMax > 0 ? draft.priceMax : null;
  const rawMin =
    draft.priceMin !== null && draft.priceMin > 0 ? draft.priceMin : null;
  /* A window entered back to front is a slip, not a preference - read it the
     way it was meant rather than returning nothing. */
  const priceMin = rawMin !== null && rawMax !== null ? Math.min(rawMin, rawMax) : rawMin;
  const priceMax = rawMin !== null && rawMax !== null ? Math.max(rawMin, rawMax) : rawMax;
  const priceAssumed = priceMax === null && priceMin === null;

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
    priceMin,
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

/** Does a list price fall inside the chosen window? An open end never excludes. */
export function priceInWindow(
  listEur: number,
  priceMin: number | null,
  priceMax: number | null,
): boolean {
  if (priceMin !== null && listEur < priceMin) return false;
  if (priceMax !== null && listEur > priceMax) return false;
  return true;
}

/** "offen" / "bis 45.000 €" / "ab 30.000 €" / "30.000-45.000 €" */
export function priceWindowLabel(
  priceMin: number | null,
  priceMax: number | null,
): string {
  const eur = (n: number) => `${Math.round(n).toLocaleString("de-DE")} €`;
  if (priceMin === null && priceMax === null) return "offen";
  if (priceMin === null) return `bis ${eur(priceMax!)}`;
  if (priceMax === null) return `ab ${eur(priceMin)}`;
  return `${Math.round(priceMin).toLocaleString("de-DE")}–${eur(priceMax)}`;
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
      value: priceWindowLabel(r.priceMin, r.priceMax),
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
  /** True when a two-sided budget window matched no car at all. */
  budgetEmpty: boolean;
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
    const cityRange = computeCityRange(car, resolved.outdoorC, resolved.startSoc);
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

    const priceFits = priceInWindow(car.listEur, resolved.priceMin, resolved.priceMax);
    const priceOutlier = resolved.priceAssumed && car.listEur > 55000;

    return { car, range, cityRange, trip, priceFits, priceOutlier };
  });

  results.sort((a, b) => {
    if (a.priceFits !== b.priceFits) return a.priceFits ? -1 : 1;
    if (a.priceOutlier !== b.priceOutlier) return a.priceOutlier ? 1 : -1;
    /* The crossover preference that used to hang off "family" is gone with it:
       it guessed at a need the body-shape question now asks outright. */
    if (resolved.use === "longDistance") {
      const d = b.range.midKm - a.range.midKm;
      if (d !== 0) return d;
    }
    if (resolved.use === "city" || resolved.dayKm <= 80) {
      const d = a.car.listEur - b.car.listEur;
      if (Math.abs(d) > 500) return d;
    }
    return b.range.midKm - a.range.midKm;
  });

  const hasWindow = resolved.priceMin !== null || resolved.priceMax !== null;
  const filtered = hasWindow
    ? results.filter((r) => r.priceFits)
    : results.filter((r) => !r.priceOutlier || resolved.priceAssumed);

  /*
   * A two-sided window can legitimately contain no car at all. Falling back to
   * the unfiltered list would answer a question nobody asked and quietly hide
   * the fact that the budget does not meet this market - so the fallback still
   * happens (an empty screen helps nobody), but `budgetEmpty` says plainly that
   * what is shown is outside the window. Every row is already marked
   * `priceFits: false`, so the UI can show both truths at once.
   */
  const budgetEmpty = hasWindow && filtered.length === 0;

  /*
   * When nothing fits, the fallback has to be the *nearest* cars, not the
   * default ordering - otherwise a 70-75k window answers with the cheapest car
   * in the catalogue while the copy claims these are the closest ones. Distance
   * to the window, ascending.
   */
  const distanceToWindow = (listEur: number): number => {
    if (resolved.priceMin !== null && listEur < resolved.priceMin) {
      return resolved.priceMin - listEur;
    }
    if (resolved.priceMax !== null && listEur > resolved.priceMax) {
      return listEur - resolved.priceMax;
    }
    return 0;
  };

  const finalList =
    filtered.length > 0
      ? filtered
      : [...results].sort(
          (a, b) => distanceToWindow(a.car.listEur) - distanceToWindow(b.car.listEur),
        );

  return { resolved, assumptions, results: finalList, budgetEmpty };
}

export { cars, climate, routes };
