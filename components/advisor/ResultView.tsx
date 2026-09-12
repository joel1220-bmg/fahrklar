"use client";

import { COPY, LONG_CHIP, MONTH_LABEL } from "@/lib/copy";
import { formatEUR, formatRangeKm } from "@/lib/engine/parse";
import type {
  Assumption,
  CarResult,
  Draft,
  LongTrip,
  ResolvedInput,
  SpeedKph,
} from "@/lib/engine/types";
import { CarCanvas } from "@/components/showroom/CarCanvas";
import { GermanyMap } from "@/components/showroom/GermanyMap";
import { ChipGroup } from "@/components/ui/ChipGroup";

type Props = {
  draft: Draft;
  onChange: (next: Draft) => void;
  resolved: ResolvedInput;
  assumptions: Assumption[];
  results: CarResult[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: () => void;
  onReset: () => void;
};

export function ResultView({
  draft,
  onChange,
  resolved,
  assumptions,
  results,
  selectedId,
  onSelect,
  onEdit,
  onReset,
}: Props) {
  const selected =
    results.find((r) => r.car.id === selectedId) ?? results[0] ?? null;

  const weatherDelta = resolved.outdoorC - 15;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-gold">
            Erste Auswahl
          </p>
          <h2 className="serif mt-2 text-2xl text-paper sm:text-3xl">
            {results.length} Autos in der engeren Auswahl
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

      {/* Fine-tune */}
      <section className="space-y-4 rounded-2xl border border-graphite-line bg-graphite-card p-4">
        <h3 className="serif text-lg text-paper">Feinschliff</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-muted">Monat</span>
            <select
              className="mt-1 min-h-11 w-full rounded-xl border border-graphite-line bg-graphite-soft px-3"
              value={draft.month ?? resolved.month}
              onChange={(e) =>
                onChange({ ...draft, month: Number(e.target.value) })
              }
            >
              {Object.entries(MONTH_LABEL).map(([n, label]) => (
                <option key={n} value={n}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <ChipGroup<`${SpeedKph}`>
            legend="Tempo Autobahn"
            value={String(draft.speedKph) as `${SpeedKph}`}
            onChange={(v) =>
              onChange({ ...draft, speedKph: Number(v) as SpeedKph })
            }
            options={[
              { value: "120", label: "120 km/h" },
              { value: "130", label: "130 km/h" },
              { value: "140", label: "140 km/h" },
            ]}
          />
          <label className="text-sm">
            <span className="text-muted">
              Start-Ladestand {Math.round(draft.startSoc * 100)} %
            </span>
            <input
              type="range"
              min={50}
              max={100}
              step={5}
              className="mt-2 w-full"
              value={Math.round(draft.startSoc * 100)}
              onChange={(e) =>
                onChange({ ...draft, startSoc: Number(e.target.value) / 100 })
              }
            />
          </label>
          <label className="text-sm">
            <span className="text-muted">Personen {draft.persons}</span>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              className="mt-2 w-full"
              value={draft.persons}
              onChange={(e) =>
                onChange({ ...draft, persons: Number(e.target.value) })
              }
            />
          </label>
        </div>
      </section>

      {/* Cards */}
      <ul className="grid gap-4 sm:grid-cols-2">
        {results.map((r) => {
          const active = selected?.car.id === r.car.id;
          return (
            <li key={r.car.id}>
              <button
                type="button"
                onClick={() => onSelect(r.car.id)}
                className={`w-full rounded-2xl border p-4 text-left transition-colors ${
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
                    className="mt-1 inline-block h-3 w-3 rounded-full"
                    style={{ background: r.car.colorHex }}
                    aria-hidden
                  />
                </div>
                <p className="mt-2 text-sm text-muted">
                  {formatEUR(r.car.listEur)} · {r.car.seats} Sitze · Wärmepumpe{" "}
                  {r.car.heatPump ? "ja" : "nein"}
                </p>
                {r.priceOutlier ? (
                  <p className="mt-1 text-xs text-assumed">Teurer Ausreißer (Budget offen)</p>
                ) : null}
                {r.trip.active && r.trip.needsStop ? (
                  <p className="mt-1 text-xs text-muted">Langstrecke: Ladehalt nötig</p>
                ) : null}
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

      {selected ? (
        <section className="space-y-4">
          <ChipGroup<LongTrip>
            legend={COPY.qLong}
            value={draft.longTrip}
            onChange={(v) => onChange({ ...draft, longTrip: v })}
            options={(Object.keys(LONG_CHIP) as LongTrip[]).map((k) => ({
              value: k,
              label: LONG_CHIP[k],
            }))}
            help={draft.longTrip === null || draft.longTrip === "none" ? COPY.qLongEmpty : COPY.qLongHint}
          />
          <GermanyMap
            polyline={selected.trip.polyline}
            routeKm={selected.trip.routeKm}
            rangeMid={selected.trip.rangeMid}
            needsStop={selected.trip.needsStop}
            stopAfterKm={selected.trip.stopAfterKm}
            routeName={selected.trip.routeName}
          />
        </section>
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
