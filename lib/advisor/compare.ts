import type { CarResult } from "@/lib/engine/types";

function tripTotalMid(r: CarResult): number {
  return r.trip.totalSpan?.mid ?? r.trip.totalMin;
}

/** Sort visible cars for Autobahn compare: fewest stops, then shortest total (mid). */
export function sortForCompare(cars: CarResult[]): CarResult[] {
  return [...cars].sort((a, b) => {
    const stopDiff = a.trip.stops.length - b.trip.stops.length;
    if (stopDiff !== 0) return stopDiff;
    return tripTotalMid(a) - tripTotalMid(b);
  });
}

export { tripTotalMid };
