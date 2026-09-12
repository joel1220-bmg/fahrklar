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

/** Simplified Germany outline (coarse). */
const OUTLINE: [number, number][] = [
  [54.9, 8.6], [54.5, 9.5], [54.4, 10.2], [54.1, 10.9], [54.3, 12.1],
  [54.1, 13.8], [53.5, 14.3], [53.0, 14.2], [52.5, 14.5], [51.9, 14.7],
  [51.1, 15.0], [50.3, 12.2], [49.5, 12.6], [48.7, 13.8], [47.5, 13.0],
  [47.4, 10.2], [47.6, 7.6], [48.9, 8.1], [49.5, 6.4], [50.3, 6.2],
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
    const firstStop = stops[0]?.afterKm ?? rangeMid * 0.75;
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
      <div className="rounded-2xl border border-graphite-line bg-graphite-card p-4 text-sm text-muted">
        Ohne Strecke bleibt die Karte leer.
      </div>
    );
  }

  return (
    <figure className="rounded-2xl border border-graphite-line bg-graphite-card p-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mx-auto h-auto w-full max-w-xs"
        role="img"
        aria-label={`Strecke ${routeKm} km`}
      >
        <polygon
          points={outlinePts}
          fill="#1f2225"
          stroke="#3a3e42"
          strokeWidth="1.5"
        />
        {corridor ? (
          <path
            d={corridor}
            fill="none"
            stroke="#d4a84b"
            strokeWidth="14"
            strokeOpacity="0.22"
            strokeLinecap="round"
          />
        ) : null}
        {routePath ? (
          <path
            d={routePath}
            fill="none"
            stroke="#d4a84b"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
        {stopPoints.map((s, i) => (
          <g key={i}>
            <circle
              cx={s.x}
              cy={s.y}
              r="7"
              fill="#1a1c1e"
              stroke="#d4a84b"
              strokeWidth="2"
            />
            <text
              x={s.x}
              y={s.y - 12}
              textAnchor="middle"
              fill="#ebe6dc"
              fontSize="9"
            >
              {s.minutes}′
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="mt-2 text-center text-xs text-muted">
        Orientierung, kein Navi.
        {stops.length > 0
          ? ` ${stops.length} Ladehalt${stops.length === 1 ? "" : "e"}.`
          : routeKm
            ? " Ohne Ladehalt auf dieser Strecke (mit Puffer)."
            : ""}
      </figcaption>
    </figure>
  );
}
