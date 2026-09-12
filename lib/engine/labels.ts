/** Short card titles: brand + model, without raw trim tokens. */

const TRIM_TOKENS = [
  "Comfort Range",
  "Long Range",
  "E-Tech",
  "Design",
  "Pro",
  "RWD",
  "Comfort",
] as const;

function stripTrimTokens(model: string): string {
  let out = model;
  for (const token of TRIM_TOKENS) {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ /g, "\\s+");
    out = out.replace(new RegExp(`\\s*\\b${escaped}\\b`, "gi"), " ");
  }
  return out.replace(/\s+/g, " ").trim();
}

/** Brand + short model (e.g. Renault 5, not 5 E-Tech Comfort Range). */
export function formatCarName(car: { brand: string; model: string }): string {
  const model = stripTrimTokens(car.model);
  return [car.brand, model].filter(Boolean).join(" ");
}
