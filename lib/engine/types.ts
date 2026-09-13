/** Fahrklar domain types — Neuwagen-Berater. Chip IDs match lib/copy.ts. */

export type BodyStyle = "hatch" | "compact" | "sedan" | "crossover";

export type UseCase = "everyday" | "family" | "highway" | "mixed";
/** @deprecated city-pair presets — kept for old localStorage only */
export type LongTrip = "none" | "hamMuc" | "berCgn" | "strBer" | "unknown";
export type ChargeOption = "home" | "work" | "public" | "unknown";
/** @deprecated chip budget — kept for old localStorage only */
export type PriceOption = "to35" | "to45" | "to60" | "over" | "unknown";
export type SpeedKph = 100 | 110 | 120 | 130 | 140;

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
  /** Set when a figure on this car looks internally inconsistent and needs
   *  checking against a primary source before go-live. Never invent a fix -
   *  widen the doubt here instead. */
  notes?: string;
}

/** File-level provenance carried by every seed JSON under data/**. */
export interface CatalogMeta {
  asOf: string;
  disclaimer: string;
  confidence: string;
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
  disclaimer?: string;
  confidence?: string;
  months: Record<string, number>;
}

export interface Draft {
  use: UseCase | null;
  /** empty string = unknown/empty → 50 km assumed */
  dayKm: string;
  dayUnknown: boolean;
  /** Multi-select body shapes; empty = all shapes */
  bodies: BodyStyle[];
  /** @deprecated city-pair — ignored by engine when tripKm is used */
  longTrip: LongTrip | null;
  /** Flexible Autobahn trip length; null = no trip sim yet */
  tripKm: number | null;
  month: number | null;
  charge: ChargeOption | null;
  /** @deprecated chip budget */
  price: PriceOption | null;
  /** Slider max list price; null / 0 = open at the top */
  priceMax: number | null;
  /** Slider min list price; null / 0 = open at the bottom */
  priceMin: number | null;
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

export interface TripStop {
  afterKm: number;
  minutes: number;
}

export interface MinSpan {
  low: number;
  mid: number;
  high: number;
}

export interface TripResult {
  active: boolean;
  tripKm: number;
  rangeMid: number;
  needsStop: boolean;
  stops: TripStop[];
  driveMin: number;
  chargeMin: number;
  extraMin: number;
  totalMin: number;
  driveSpan: MinSpan;
  extraSpan: MinSpan;
  totalSpan: MinSpan;
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
  bodies: BodyStyle[];
  bodiesAssumed: boolean;
  tripKm: number | null;
  tripActive: boolean;
  month: number;
  monthAssumed: boolean;
  charge: ChargeOption;
  chargeAssumed: boolean;
  priceMax: number | null;
  priceMin: number | null;
  priceAssumed: boolean;
  speedKph: SpeedKph;
  startSoc: number;
  persons: number;
  outdoorC: number;
}

export function emptyDraft(): Draft {
  return {
    use: null,
    dayKm: "",
    dayUnknown: false,
    bodies: [],
    longTrip: null,
    tripKm: null,
    month: null,
    charge: null,
    price: null,
    priceMax: null,
  priceMin: null,
    speedKph: 120,
    startSoc: 1.0,
    persons: 2,
  };
}
