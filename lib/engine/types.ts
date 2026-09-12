/** Fahrklar domain types — Neuwagen-Berater. Chip IDs match lib/copy.ts. */

export type BodyStyle = "hatch" | "sedan" | "crossover";

export type UseCase = "everyday" | "family" | "highway" | "mixed";
export type LongTrip = "none" | "hamMuc" | "berCgn" | "strBer" | "unknown";
export type ChargeOption = "home" | "work" | "public" | "unknown";
export type PriceOption = "to35" | "to45" | "to60" | "over" | "unknown";
export type SpeedKph = 120 | 130 | 140;

export interface Car {
  id: string;
  brand: string;
  model: string;
  body: BodyStyle;
  seats: number;
  listEur: number;
  usableKwh: number;
  wltpKm: number;
  /** kWh/100 km on Autobahn at 15 °C / 130 km/h */
  highwayKwhPer100: number;
  dcPeakKw: number;
  heatPump: boolean;
  colorHex: string;
  asOf: string;
}

export interface RouteDef {
  id: "hamMuc" | "berCgn" | "strBer";
  name: string;
  km: number;
  mostlyAutobahn: boolean;
  /** [lat, lng] */
  polyline: [number, number][];
}

export interface ClimateMonths {
  asOf: string;
  note: string;
  months: Record<string, number>;
}

export interface Draft {
  use: UseCase | null;
  /** empty string = unknown/empty → 50 km assumed */
  dayKm: string;
  dayUnknown: boolean;
  longTrip: LongTrip | null;
  month: number | null;
  charge: ChargeOption | null;
  price: PriceOption | null;
  speedKph: SpeedKph;
  startSoc: number;
  persons: number;
}

export interface Assumption {
  key: string;
  label: string;
  value: string;
  assumed: boolean;
}

export interface RangeSpan {
  lowKm: number;
  midKm: number;
  highKm: number;
  outdoorC: number;
  speedKph: SpeedKph;
  kwhPer100: number;
}

export interface TripResult {
  active: boolean;
  routeId: string | null;
  routeName: string | null;
  routeKm: number;
  rangeMid: number;
  needsStop: boolean;
  remainingKm: number;
  stopAfterKm: number | null;
  polyline: [number, number][] | null;
}

export interface CarResult {
  car: Car;
  range: RangeSpan;
  trip: TripResult;
  priceFits: boolean;
  priceOutlier: boolean;
}

export interface ResolvedInput {
  use: UseCase;
  useAssumed: boolean;
  dayKm: number;
  dayAssumed: boolean;
  longTrip: LongTrip;
  longAssumed: boolean;
  month: number;
  monthAssumed: boolean;
  charge: ChargeOption;
  chargeAssumed: boolean;
  price: PriceOption;
  priceAssumed: boolean;
  speedKph: SpeedKph;
  startSoc: number;
  persons: number;
  outdoorC: number;
  route: RouteDef | null;
}

export function emptyDraft(): Draft {
  return {
    use: null,
    dayKm: "",
    dayUnknown: false,
    longTrip: null,
    month: null,
    charge: null,
    price: null,
    speedKph: 130,
    startSoc: 0.9,
    persons: 2,
  };
}
