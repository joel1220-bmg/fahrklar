"use client";

import { COPY, MONTH_LABEL } from "@/lib/copy";
import { formatEUR, formatRangeKm } from "@/lib/engine/parse";
import type {
  Assumption,
  CarResult,
  Draft,
  ResolvedInput,
  SpeedKph,
} from "@/lib/engine/types";
import { CarCanvas } from "@/components/showroom/CarCanvas";
import { GermanyMap } from "@/components/showroom/GermanyMap";

type Props = {
  draft: Draft;
  onChange: (next: Draft) => void;
  resolved: ResolvedInput;
  assumptions: Assumption[];
  results: CarResult[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDismiss: (id: string) => void;
  onEdit: () => void;
  onReset: () => void;
};

function formatHours(min: number): string {
  const h = min / 60;
  if (h < 1) return `${Math.round(min)} Min`;
  return `${h.toLocaleString("de-DE", { maximumFractionDigits: 1 })} Std`;
}

function formatHourSpan(low: number, high: number): string {
  if (low === high) return `ca. ${formatHours(low)}`;
  const a = formatHours(Math.min(low, high));
  const b = formatHours(Math.max(low, high));
  return `ca. ${a}–${b}`;
}

export function ResultView({
  draft,
  onChange,
  resolved,
  assumptions,
  results,
  selectedId,
  onSelect,
  onDismiss,
  onEdit,
  onReset,
}: Props) {
  const selected =
    results.find((r) => r.car.id === selectedId) ?? results[0] ?? null;

  const weatherDelta = resolved.outdoorC - 15;
  const tripKmVal = draft.tripKm ?? 80;
  const priceVal =
    draft.priceMax && draft.priceMax > 0 ? draft.priceMax : 0;
  const tripActive = selected?.trip.active ?? false;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-gold">
            Erste Auswahl
          </p>
          <h2 className="serif mt-2 text-2xl text-paper sm:text-3xl">
            {results.length} Autos in der Auswahl
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted">{COPY.wltpAlways}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="min-h-10 rounded-full border border-graphite-line px-4 text-sm text-paper hover:border-gold"
          >
            {COPY.editQuestions}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="min-h-10 rounded-full border border-graphite-line px-4 text-sm text-muted hover:text-paper"
          >
            {COPY.reset}
          </button>
        </div>
      </div>

      {/* Weather strip */}
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-graphite-line bg-graphite-card px-4 py-3 text-sm">
        <span className="text-gold">{MONTH_LABEL[resolved.month]}</span>
        <span>
          ca. {resolved.outdoorC.toLocaleString("de-DE", { maximumFractionDigits: 1 })} °C
        </span>
        <span className="text-muted">
          Effekt vs. 15 °C:{" "}
          {weatherDelta === 0
            ? "neutral"
            : weatherDelta < 0
              ? `${weatherDelta.toLocaleString("de-DE", { maximumFractionDigits: 1 })} °C — Heizung kostet Reichweite`
              : `+${weatherDelta.toLocaleString("de-DE", { maximumFractionDigits: 1 })} °C — milder`}
        </span>
      </div>

      {/* Assumptions */}
      <section aria-label="Angaben">
        <p className="text-xs text-muted">{COPY.assumedBanner}</p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {assumptions.map((a) => (
            <li
              key={a.key}
              className={`rounded-xl border px-3 py-2 text-sm ${
                a.assumed
                  ? "border-graphite-line bg-graphite-soft text-assumed"
                  : "border-graphite-line bg-graphite-card text-paper"
              }`}
            >
              <span className="text-xs uppercase tracking-wide text-muted">
                {a.assumed ? "Angenommen" : "Eingegeben"} · {a.label}
              </span>
              <div className="mt-0.5">{a.value}</div>
            </li>
          ))}
        </ul>
      </section>

      {/* Live sliders: month, tripKm, speed, priceMax */}
      <section className="space-y-4 rounded-2xl border border-graphite-line bg-graphite-card p-4">
        <h3 className="serif text-lg text-paper">Feinschliff</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-muted">
              Monat · {MONTH_LABEL[draft.month ?? resolved.month]}
            </span>
            <input
              type="range"
              min={1}
              max={12}
              step={1}
              className="mt-2 w-full"
              value={draft.month ?? resolved.month}
              onChange={(e) =>
                onChange({ ...draft, month: Number(e.target.value) })
              }
            />
          </label>

          <label className="text-sm">
            <span className="text-muted">
              {COPY.qTrip} ·{" "}
              {draft.tripKm !== null ? `${draft.tripKm} km` : "—"}
            </span>
            <input
              type="range"
              min={80}
              max={900}
              step={10}
              className="mt-2 w-full"
              value={tripKmVal}
              onChange={(e) =>
                onChange({ ...draft, tripKm: Number(e.target.value) })
              }
            />
            <span className="mt-1 block text-xs text-muted">
              {draft.tripKm === null ? COPY.qTripEmpty : COPY.qTripHint}
            </span>
          </label>

          <label className="text-sm">
            <span className="text-muted">Tempo Autobahn · {draft.speedKph} km/h</span>
            <input
              type="range"
              min={100}
              max={140}
              step={10}
              className="mt-2 w-full"
              value={draft.speedKph}
              onChange={(e) =>
                onChange({
                  ...draft,
                  speedKph: Number(e.target.value) as SpeedKph,
                })
              }
            />
          </label>

          <label className="text-sm">
            <span className="text-muted">
              Kaufpreis max ·{" "}
              {priceVal > 0
                ? `${priceVal.toLocaleString("de-DE")} €`
                : "offen"}
            </span>
            <input
              type="range"
              min={28000}
              max={75000}
              step={1000}
              className="mt-2 w-full"
              value={priceVal > 0 ? priceVal : 50000}
              onChange={(e) =>
                onChange({ ...draft, priceMax: Number(e.target.value) })
              }
            />
          </label>
        </div>
      </section>

      {/* Exactly 3 cards */}
      <ul className="grid gap-4 sm:grid-cols-3">
        {results.map((r) => {
          const active = selected?.car.id === r.car.id;
          return (
            <li key={r.car.id} className="relative">
              <button
                type="button"
                onClick={() => onSelect(r.car.id)}
                className={`w-full rounded-2xl border p-4 pr-10 text-left transition-colors ${
                  active
                    ? "border-gold bg-graphite-card"
                    : "border-graphite-line bg-graphite-soft hover:border-gold-dim"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="serif text-lg text-paper">
                      {r.car.brand} {r.car.model}
                    </p>
                    <p className="mt-1 text-sm text-gold">
                      {formatRangeKm(r.range.lowKm, r.range.highKm)}
                    </p>
                  </div>
                  <span
                    className="mt-1 inline-block h-3 w-3 shrink-0 rounded-full"
                    style={{ background: r.car.colorHex }}
                    aria-hidden
                  />
                </div>
                <p className="mt-2 text-sm text-muted">
                  {formatEUR(r.car.listEur)} · {r.car.seats} Sitze · Wärmepumpe{" "}
                  {r.car.heatPump ? "ja" : "nein"}
                </p>
                {r.priceOutlier ? (
                  <p className="mt-1 text-xs text-assumed">
                    Teurer Ausreißer (Budget offen)
                  </p>
                ) : null}
                {r.trip.active && r.trip.needsStop ? (
                  <p className="mt-1 text-xs text-muted">
                    Autobahn: {r.trip.stops.length} Ladehalt
                    {r.trip.stops.length === 1 ? "" : "e"}
                  </p>
                ) : null}
              </button>
              <button
                type="button"
                aria-label={COPY.dismissCar}
                title={COPY.dismissCar}
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(r.car.id);
                }}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-graphite-line bg-graphite-soft text-sm text-muted hover:border-gold hover:text-paper"
              >
                ×
              </button>
              <button
                type="button"
                onClick={() => onDismiss(r.car.id)}
                className="mt-2 w-full text-center text-xs text-muted underline hover:text-paper"
              >
                {COPY.dismissCar}
              </button>
            </li>
          );
        })}
      </ul>

      {/* Showroom hero */}
      {selected ? (
        <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <CarCanvas
            body={selected.car.body}
            color={selected.car.colorHex}
            className="min-h-[320px] h-[42vh] lg:h-[480px]"
          />
          <div className="flex flex-col justify-center space-y-4">
            <p className="text-xs uppercase tracking-[0.14em] text-gold">Showroom</p>
            <h3 className="serif text-3xl text-paper sm:text-4xl">
              {selected.car.brand} {selected.car.model}
            </h3>
            <p className="text-sm text-muted">
              Autobahn-Reichweite {MONTH_LABEL[resolved.month]}:{" "}
              <span className="text-paper">
                {formatRangeKm(selected.range.lowKm, selected.range.highKm)}
              </span>
            </p>
            <p className="text-sm text-muted">
              Kaufpreis grob{" "}
              <span className="text-paper">{formatEUR(selected.car.listEur)}</span>
              {" · "}
              {selected.car.seats} Sitze
              {" · "}
              Wärmepumpe {selected.car.heatPump ? "ja" : "nein"}
            </p>
            <p className="text-xs text-muted">
              Prüfstand (WLTP) {selected.car.wltpKm} km — Laborwert, nicht Alltag.
            </p>
          </div>
        </section>
      ) : (
        <p className="text-muted">Mit diesen Angaben finden wir gerade kein Auto.</p>
      )}

      {/* Trip map + times — only when trip active */}
      {selected && tripActive ? (
        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <GermanyMap
            polyline={selected.trip.polyline}
            routeKm={selected.trip.tripKm}
            rangeMid={selected.trip.rangeMid}
            stops={selected.trip.stops}
          />
          <div className="space-y-3 rounded-2xl border border-graphite-line bg-graphite-card p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-gold">
              Strecke {selected.trip.tripKm} km
            </p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{COPY.tripDrive}</dt>
                <dd className="text-paper">
                  {formatHourSpan(selected.trip.driveSpan.low, selected.trip.driveSpan.high)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">{COPY.tripCharge}</dt>
                <dd className="text-paper">
                  {selected.trip.extraSpan.low === selected.trip.extraSpan.high
                    ? `ca. ${selected.trip.extraMin} Min`
                    : `ca. ${selected.trip.extraSpan.low}–${selected.trip.extraSpan.high} Min`}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-graphite-line pt-2">
                <dt className="font-medium text-paper">{COPY.tripTotal}</dt>
                <dd className="font-medium text-gold">
                  {formatHourSpan(selected.trip.totalSpan.low, selected.trip.totalSpan.high)}
                </dd>
              </div>
            </dl>
            {selected.trip.stops.length > 0 ? (
              <ul className="mt-3 space-y-1 border-t border-graphite-line pt-3 text-sm text-muted">
                {selected.trip.stops.map((s, i) => (
                  <li key={i}>
                    nach {s.afterKm} km · ca. {s.minutes} Min
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">
                Ohne Ladehalt auf dieser Strecke (mit Puffer).
              </p>
            )}
          </div>
        </section>
      ) : selected && draft.tripKm === null ? (
        <p className="text-sm text-muted">{COPY.qTripEmpty}</p>
      ) : null}

      {/* Exactly ONE next step */}
      <aside className="rounded-2xl border border-gold/40 bg-graphite-card p-5">
        <p className="text-xs uppercase tracking-[0.14em] text-gold">Nächster Schritt</p>
        <p className="mt-2 text-base text-paper">{COPY.morningStep}</p>
        <p className="mt-3 text-xs text-muted">{COPY.notCertified}</p>
      </aside>
    </div>
  );
}
