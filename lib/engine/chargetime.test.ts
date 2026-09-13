/**
 * What the reader is shown about charging.
 *
 * `ladekurve-lock.md` is blunt about this: "Unterwegs zählt, wie schnell das
 * Auto von etwa 10 auf 80 Prozent nachlädt, nicht die große Peak-Zahl auf dem
 * Datenblatt", and `dcPeakKw` is "nur Referenz, nie Zeitbasis". The comparison
 * table showed the peak and nothing else until 13.09.2026, which invited the
 * one comparison the lock forbids.
 */

import { describe, expect, it } from "vitest";
import climateJson from "@/data/climate-months.de.json";
import { avgKwSpanForCar, charge1080Min, STOP_ENERGY_FRAC } from "./charge";
import { getCars } from "./evaluate";

const months = (climateJson as { months: Record<string, number> }).months;
const DEC = months["12"]!;
const JUN = months["6"]!;

describe("10 to 80 per cent, in minutes", () => {
  it("is a span, fastest first", () => {
    for (const c of getCars()) {
      const m = charge1080Min(c);
      expect(m.low, c.id).toBeLessThan(m.mid);
      expect(m.mid, c.id).toBeLessThan(m.high);
    }
  });

  it("matches the energy and average power it is derived from", () => {
    for (const c of getCars()) {
      const kw = avgKwSpanForCar(c);
      const energy = c.usableKwh * STOP_ENERGY_FRAC;
      // At 20 °C the temperature factor is 1, so the arithmetic is exact.
      const expected = Math.round((energy / kw.mid) * 60);
      expect(charge1080Min(c, 20).mid, c.id).toBe(expected);
    }
  });

  it("takes longer in December than in June", () => {
    for (const c of getCars()) {
      expect(charge1080Min(c, DEC).mid, c.id).toBeGreaterThan(
        charge1080Min(c, JUN).mid,
      );
    }
  });

  it("punishes an unpreconditioned battery in the cold", () => {
    const c = getCars()[0]!;
    expect(charge1080Min(c, DEC, false).mid).toBeGreaterThan(
      charge1080Min(c, DEC, true).mid,
    );
  });

  it("stays inside plausible bounds for every car in the catalogue", () => {
    for (const c of getCars()) {
      const m = charge1080Min(c, JUN);
      // Nothing on sale charges 10-80 in under a quarter of an hour, and a
      // figure past two hours would mean the model has come apart.
      expect(m.low, c.id).toBeGreaterThan(14);
      expect(m.high, c.id).toBeLessThan(120);
    }
  });
});

describe("the rule the lock states outright", () => {
  it("lets a flatter curve beat a higher peak", () => {
    /* ladekurve-lock.md: "flache Kurve mit niedrigerem Peak kann kürzer stehen
       als peakige Kurve mit höherem Peak." If no pair in the catalogue shows
       that, the table is safe to compare by peak and this whole change was
       pointless — so the property is asserted, not assumed. */
    const cars = getCars();
    let found = false;
    for (const a of cars) {
      for (const b of cars) {
        if (a.id === b.id) continue;
        if (a.dcPeakKw < b.dcPeakKw && charge1080Min(a).mid < charge1080Min(b).mid) {
          found = true;
        }
      }
    }
    expect(found).toBe(true);
  });

  it("does not order cars the same way peak power does", () => {
    const cars = [...getCars()];
    const byPeak = [...cars].sort((x, y) => y.dcPeakKw - x.dcPeakKw).map((c) => c.id);
    const byTime = [...cars]
      .sort((x, y) => charge1080Min(x).mid - charge1080Min(y).mid)
      .map((c) => c.id);
    expect(byTime).not.toEqual(byPeak);
  });
});
