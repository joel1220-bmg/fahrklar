import { emptyDraft, type BodyStyle, type Draft, type SpeedKph } from "@/lib/engine/types";
import { draftSchema } from "@/lib/schema";

export const STORAGE_KEY = "fahrklar-draft-v1";
export const REMEMBER_KEY = "fahrklar-remember-v1";

function clampSpeed(n: number): SpeedKph {
  const steps: SpeedKph[] = [100, 110, 120, 130, 140];
  let best: SpeedKph = 120;
  let bestD = Infinity;
  for (const s of steps) {
    const d = Math.abs(s - n);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  return best;
}

function normalizeBodies(raw: unknown): BodyStyle[] {
  if (!Array.isArray(raw)) return [];
  const allowed = new Set<BodyStyle>(["hatch", "compact", "kombi", "sedan", "crossover"]);
  return raw.filter((b): b is BodyStyle => typeof b === "string" && allowed.has(b as BodyStyle));
}

export function loadRemember(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(REMEMBER_KEY) === "1";
  } catch {
    return false;
  }
}

export function setRemember(on: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (on) window.localStorage.setItem(REMEMBER_KEY, "1");
    else {
      window.localStorage.removeItem(REMEMBER_KEY);
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* private mode / quota */
  }
}

export function loadDraft(): Draft | null {
  if (typeof window === "undefined") return null;
  if (!loadRemember()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = draftSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    const data = parsed.data;
    const base = emptyDraft();
    return {
      ...base,
      use: data.use ?? base.use,
      dayKm: data.dayKm ?? base.dayKm,
      dayUnknown: data.dayUnknown ?? base.dayUnknown,
      bodies: normalizeBodies(data.bodies),
      longTrip: data.longTrip ?? base.longTrip,
      tripKm: data.tripKm !== undefined ? data.tripKm : base.tripKm,
      month: data.month ?? base.month,
      charge: data.charge ?? base.charge,
      price: data.price ?? base.price,
      priceMax: data.priceMax !== undefined ? data.priceMax : base.priceMax,
      speedKph: clampSpeed(Number(data.speedKph) || base.speedKph),
      startSoc: data.startSoc ?? base.startSoc,
      persons: data.persons ?? base.persons,
    };
  } catch {
    return null;
  }
}

export function saveDraft(draft: Draft): void {
  if (typeof window === "undefined") return;
  if (!loadRemember()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    /* private mode / quota */
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
