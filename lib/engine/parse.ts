/** German-number parsing and formatting. */

export function parseDeNumber(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  let s = input.trim().replace(/\s/g, "").replace(/€/g, "").replace(/%/g, "");
  if (!s || s === "-" || s === "–") return null;
  s = s.replace(/−/g, "-");
  const neg = s.startsWith("-");
  if (neg) s = s.slice(1);
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) {
    const lastComma = s.lastIndexOf(",");
    const lastDot = s.lastIndexOf(".");
    if (lastComma > lastDot) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (hasComma) {
    s = s.replace(",", ".");
  } else if (hasDot) {
    const parts = s.split(".");
    if (parts.length === 2 && parts[1]!.length === 3 && parts[0]!.length > 0 && parts[0]!.length <= 3) {
      s = parts.join("");
    } else if (parts.length > 2) {
      s = parts.join("");
    }
  }
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return neg ? -n : n;
}

export function formatDeNumber(n: number, decimals = 0): string {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
}

export function formatEUR(n: number): string {
  return `${formatDeNumber(Math.round(n))}\u00a0€`;
}

export function formatKm(n: number): string {
  return `${formatDeNumber(Math.round(n))}\u00a0km`;
}

export function formatRangeKm(low: number, high: number): string {
  return `${formatDeNumber(Math.round(low))}–${formatDeNumber(Math.round(high))}\u00a0km`;
}
