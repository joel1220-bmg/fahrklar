import { z } from "zod";

const speedSchema = z.union([
  z.literal(100),
  z.literal(110),
  z.literal(120),
  z.literal(130),
  z.literal(140),
  z.number().min(100).max(140),
]);

const bodyStyleSchema = z.enum(["hatch", "compact", "sedan", "crossover"]);

/** Optional fields + passthrough so old localStorage drafts still parse. */
export const draftSchema = z
  .object({
    /*
     * A draft saved before 13.09.2026 carries one of the four old use cases.
     * Rejecting it would silently drop the reader's whole saved answer set over
     * one field, so the retired values are translated onto the new axis instead:
     * "Alltag" was the city end, "Lange Autobahnfahrten" the far end, and both
     * "Familie" and "Alles etwas" sat in between.
     */
    use: z
      .preprocess((v) => {
        const legacy: Record<string, string> = {
          everyday: "city",
          family: "cityTrips",
          mixed: "cityTrips",
          highway: "longDistance",
        };
        return typeof v === "string" && v in legacy ? legacy[v] : v;
      }, z.enum(["city", "cityTrips", "longDistance"]).nullable())
      .nullable(),
    dayKm: z.string(),
    dayUnknown: z.boolean(),
    bodies: z.array(bodyStyleSchema).optional(),
    longTrip: z
      .enum(["none", "hamMuc", "berCgn", "strBer", "unknown"])
      .nullable()
      .optional(),
    tripKm: z.number().nullable().optional(),
    month: z.number().int().min(1).max(12).nullable(),
    charge: z.enum(["home", "work", "public", "unknown"]).nullable(),
    price: z
      .enum(["to35", "to45", "to60", "over", "unknown"])
      .nullable()
      .optional(),
    priceMax: z.number().nullable().optional(),
    priceMin: z.number().nullable().optional(),
    speedKph: speedSchema,
    startSoc: z.number().min(0.1).max(1),
    persons: z.number().int().min(1).max(7),
  })
  .passthrough();
