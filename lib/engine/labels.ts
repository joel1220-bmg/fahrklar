/** Short card titles: brand + model, without raw trim tokens. */

/**
 * Brand plus the full model designation.
 *
 * This used to strip trim tokens - Pro, Long Range, Design, RWD, Comfort - to
 * keep names short, and in doing so threw away the one thing that tells two
 * cars apart. A VW ID.3 Pro and an ID.3 Pro S are different battery sizes and
 * therefore different answers to the question this whole site asks; showing
 * both as "Volkswagen ID.3" made the catalogue look like it listed the same car
 * twice. Long names are the lesser problem.
 */
export function formatCarName(car: { brand: string; model: string }): string {
  return [car.brand, car.model].filter(Boolean).map((s) => s.trim()).join(" ");
}
