"use client";

import { useMemo } from "react";
import type { TripStop } from "@/lib/engine/types";

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

function pointAlong(
  polyline: [number, number][],
  afterKm: number,
  routeKm: number,
): [number, number] | null {
  if (!polyline.length || routeKm <= 0) return null;
  const t = Math.min(0.98, Math.max(0.02, afterKm / routeKm));
  const seg = t * (polyline.length - 1);
  const i = Math.floor(seg);
  const f = seg - i;
  const a = polyline[i]!;
  const b = polyline[Math.min(i + 1, polyline.length - 1)]!;
  const lat = a[0] + (b[0] - a[0]) * f;
  const lng = a[1] + (b[1] - a[1]) * f;
  return project(lat, lng);
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
    if (!polyline || polyline.length < 2 || rangeMid <= 0) return null;
    const cover = Math.min(1, (rangeMid * 0.75) / Math.max(routeKm, 1));
    const idx = Math.max(1, Math.floor((polyline.length - 1) * Math.min(1, cover * 1.2)));
    return polyline
      .slice(0, idx + 1)
      .map(([la, ln], i) => {
        const [x, y] = project(la, ln);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }, [polyline, rangeMid, routeKm]);

  const stopPoints = useMemo(() => {
    if (!polyline || !stops.length) return [];
    return stops
      .map((s) => {
        const pt = pointAlong(polyline, s.afterKm, routeKm);
        return pt ? { ...s, x: pt[0], y: pt[1] } : null;
      })
      .filter((x): x is TripStop & { x: number; y: number } => x !== null);
  }, [polyline, stops, routeKm]);

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
