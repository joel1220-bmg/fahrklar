import { z } from "zod";

export const draftSchema = z.object({
  use: z.enum(["everyday", "family", "highway", "mixed"]).nullable(),
  dayKm: z.string(),
  dayUnknown: z.boolean(),
  longTrip: z.enum(["none", "hamMuc", "berCgn", "strBer", "unknown"]).nullable(),
  month: z.number().int().min(1).max(12).nullable(),
  charge: z.enum(["home", "work", "public", "unknown"]).nullable(),
  price: z.enum(["to35", "to45", "to60", "over", "unknown"]).nullable(),
  speedKph: z.union([z.literal(120), z.literal(130), z.literal(140)]),
  startSoc: z.number().min(0.1).max(1),
  persons: z.number().int().min(1).max(7),
});
