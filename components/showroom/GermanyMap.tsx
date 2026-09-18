"use client";

import { useMemo } from "react";
import type { TripStop } from "@/lib/engine/types";
import { geodesicKm, pointAtKm } from "@/lib/engine/range";

type Props = {
  polyline: [number, number][] | null;
  routeKm: number;
  rangeMid: number;
  stops: TripStop[];
};

/** Rough DE bounding box for SVG projection. */
const LAT_MIN = 47.2;
const LAT_MAX = 55.1;
const LNG_MIN = 5.8;
const LNG_MAX = 15.1;
const W = 320;
const H = 380;

function project(lat: number, lng: number): [number, number] {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * W;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * H;
  return [x, y];
}

/**
 * Simplified Germany outline (coarse).
 *
 * Exported so a test can check that every drawn route actually lies inside the
 * country: the corridor's northern anchor once sat above this line, and the
 * route visibly started outside the border.
 */
export const OUTLINE: [number, number][] = [
  // The Flensburg corner. Without it the line cuts straight from Sylt to Kiel
  // and the whole Schleswig peninsula falls outside the drawn country.
  [54.9, 8.6], [54.87, 9.45], [54.5, 9.5], [54.4, 10.2], [54.1, 10.9], [54.3, 12.1],
  [54.1, 13.8], [53.5, 14.3], [53.0, 14.2], [52.5, 14.5], [51.9, 14.7],
  [51.1, 15.0], [50.3, 12.2], [49.5, 12.6], [48.7, 13.8], [47.7, 12.9],
  // The Alpine border, which used to be one straight cut at 47.45 and so
  // swallowed a strip of Austria, Kufstein included.
  [47.62, 12.2], [47.6, 11.3], [47.4, 10.2], [47.6, 7.6], [48.9, 8.1], [49.5, 6.4], [50.3, 6.2],
  [51.0, 6.0], [51.8, 6.1], [53.0, 7.0], [53.7, 7.2], [54.9, 8.6],
];

function pointAlongKm(polyline: [number, number][], afterKm: number): [number, number] | null {
  const ll = pointAtKm(polyline, afterKm);
  return ll ? project(ll[0], ll[1]) : null;
}

export function GermanyMap({ polyline, routeKm, rangeMid, stops }: Props) {
  const outlinePts = useMemo(
    () => OUTLINE.map(([la, ln]) => project(la, ln).join(",")).join(" "),
    [],
  );

  const routePath = useMemo(() => {
    if (!polyline || polyline.length < 2) return null;
    return polyline
      .map(([la, ln], i) => {
        const [x, y] = project(la, ln);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }, [polyline]);

  const corridor = useMemo(() => {
    if (!polyline || polyline.length < 2) return null;
    const firstStop = stops[0]?.afterKm ?? (rangeMid * 0.8) / 0.9;
    const cut = Math.min(firstStop, routeKm);
    const pts: [number, number][] = [polyline[0]!];
    let acc = 0;
    for (let i = 1; i < polyline.length; i++) {
      const a = polyline[i - 1]!;
      const b = polyline[i]!;
      const seg = geodesicKm(a, b);
      if (acc + seg >= cut) {
        const end = pointAtKm(polyline, cut);
        if (end) pts.push(end);
        break;
      }
      acc += seg;
      pts.push(b);
    }
    return pts
      .map(([la, ln], i) => {
        const [x, y] = project(la, ln);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }, [polyline, rangeMid, routeKm, stops]);

  const stopPoints = useMemo(() => {
    if (!polyline || !stops.length) return [];
    return stops
      .map((s) => {
        const pt = pointAlongKm(polyline, s.afterKm);
        return pt ? { ...s, x: pt[0], y: pt[1] } : null;
      })
      .filter((x): x is TripStop & { x: number; y: number } => x !== null);
  }, [polyline, stops]);

  if (!polyline) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-4 text-sm text-muted">
        Ohne Strecke bleibt die Karte leer.
      </div>
    );
  }

  return (
    <figure className="rounded-2xl border border-line bg-surface p-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto h-auto w-full max-w-xs"
        role="img"
        aria-label={`Strecke ${routeKm} km`}
      >
        {/*
         * Visual hierarchy, quietest to loudest — the reader's anxiety is "where
         * do I have to stop," so the stops must win the eye, not the landmass.
         *
         * 1. Country shape: --color-sunken fill / --color-line-strong stroke.
         *    Deliberately low-contrast (1.18:1 fill-on-card, 1.65-1.95:1 stroke)
         *    — the same quiet register --color-data-track already sits in
         *    (see the comment by the token definitions in globals.css). It is
         *    context, not information; the route and stops below carry the
         *    facts, so the shape doesn't need to fight for attention.
         * 2. Corridor (reachable before the first stop): --color-data-range-soft,
         *    full opacity so the token's own audited color is what's on screen,
         *    not a faded blend nobody computed. This is literally RangeBar's
         *    span technique reused: a soft fill that can't (and needn't) carry
         *    3:1 on its own, with a solid stroke on top carrying the boundary
         *    — here that solid stroke is the route line itself (step 3).
         * 3. Route: --color-accent. 6.43:1 on the country fill, 7.60:1 on the
         *    white card — clears both AA text and 1.4.11 non-text contrast
         *    against either background the line can cross, so it stays legible
         *    however the route bends relative to the coarse outline. (The old
         *    gold, #d4a84b, was only 2.21:1 off the landmass — it was already
         *    failing 1.4.11 wherever a route ran near the card, not just where
         *    the label did.)
         * 4. Stops: --color-accent-strong ring + dot, 8.86:1 on the country
         *    fill and 10.48:1 on the card — the boldest thing in the frame,
         *    which is the point: this is the answer to "where do I stop."
         *    The time label sits in an opaque --color-accent-strong pill with
         *    white text (10.48:1) instead of colored text on whatever the map
         *    happens to render behind it. That was finding 1.2 in
         *    docs/audit-2026-09-12.md: the old near-white label (#ebe6dc) was
         *    12.85:1 on the dark landmass but only 1.24:1 the moment a stop
         *    (or a differently-shaped route) put it on the card instead — an
         *    opaque pill makes the label's contrast constant, not a bet on
         *    where the polyline happens to run.
         */}
        <polygon
          points={outlinePts}
          fill="var(--color-sunken)"
          stroke="var(--color-line-strong)"
          strokeWidth="1.25"
        />
        {corridor ? (
          <path
            d={corridor}
            fill="none"
            stroke="var(--color-data-range-soft)"
            strokeWidth="14"
            strokeLinecap="round"
          />
        ) : null}
        {routePath ? (
          <path
            d={routePath}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
        {stopPoints.map((s, i) => {
          const label = `${s.minutes}′`;
          /*
           * Sized in viewBox units, so what matters is how big this ends up
           * after the SVG is scaled into its column. The map renders about
           * 232px wide against a 320-unit box, so roughly 0.72x: a fontSize of
           * 9 arrived as 6.5px on screen, which is not a readable number. 15
           * lands near 11px, which is.
           *
           * No text-measurement API in server-rendered SVG, so the pill width
           * is estimated from the character count with a generous per-character
           * budget. A slightly wide pill is invisible; a clipped label is the
           * bug the pill exists to prevent.
           */
          const pillWidth = label.length * 9 + 10;
          const pillHeight = 20;
          const labelY = s.y - 17;
          return (
            <g key={i}>
              <rect
                x={s.x - pillWidth / 2}
                y={labelY - pillHeight / 2}
                width={pillWidth}
                height={pillHeight}
                rx={pillHeight / 2}
                fill="var(--color-accent-strong)"
                stroke="var(--color-surface)"
                strokeWidth="1"
              />
              <text
                x={s.x}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="central"
                fill="var(--color-surface)"
                fontSize="15"
                fontWeight="600"
              >
                {label}
              </text>
              <circle
                cx={s.x}
                cy={s.y}
                r="8"
                fill="var(--color-surface)"
                stroke="var(--color-accent-strong)"
                strokeWidth="2.5"
              />
              <circle cx={s.x} cy={s.y} r="2.75" fill="var(--color-accent-strong)" />
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 text-center text-xs text-muted">
        Orientierung, kein Navi.
        {/* The pills carry a bare number with a prime mark. For a reader who
            has never charged a car that could just as easily be kilometres,
            so the caption says once what the number is. */}
        {stops.length > 0
          ? ` ${stops.length} Ladestopp${stops.length === 1 ? "" : "s"}, Zahl in Minuten.`
          : routeKm
            ? " Ohne Ladestopp auf dieser Strecke (mit Puffer)."
            : ""}
      </figcaption>
    </figure>
  );
}
