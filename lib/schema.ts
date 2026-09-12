import { z } from "zod";

const speedSchema = z.union([
  z.literal(100),
  z.literal(110),
  z.literal(120),
  z.literal(130),
  z.literal(140),
  z.number().min(100).max(140),
]);

/** Optional fields + passthrough so old localStorage drafts still parse. */
export const draftSchema = z
  .object({
    use: z.enum(["everyday", "family", "highway", "mixed"]).nullable(),
    dayKm: z.string(),
    dayUnknown: z.boolean(),
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
    speedKph: speedSchema,
    startSoc: z.number().min(0.1).max(1),
    persons: z.number().int().min(1).max(7),
  })
  .passthrough();
