import type { CarResult } from "@/lib/engine/types";

/**
 * The comparison table used to reorder its columns by fewest stops, then by
 * shortest total time. That was removed on 13.09.2026: the table already shows
 * stops and total time in their own rows, so sorting by them told the reader
 * nothing the numbers did not, and it cost something real. The cards above the
 * table have one order; a car that moved between the two was hard to follow,
 * and the order silently changed under the reader every time they nudged a
 * slider. The columns now follow the card order, and the ranking stays the
 * reader's to make.
 */

/** Total trip minutes for a car, the middle of its span. */
export function tripTotalMid(r: CarResult): number {
  return r.trip.totalSpan.mid;
}
