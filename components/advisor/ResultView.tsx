"use client";

import { useId, useMemo, useState } from "react";
import { COPY, MONTH_LABEL } from "@/lib/copy";
import { formatEUR, formatRangeKm } from "@/lib/engine/parse";
import { formatCarName } from "@/lib/engine/labels";
import { formatDeUnit, Num, NumSpan } from "@/components/ui/Num";
import type {
  Assumption,
  CarResult,
  Draft,
  ResolvedInput,
  SpeedKph,
} from "@/lib/engine/types";
import { sortForCompare, tripTotalMid } from "@/lib/advisor/compare";
import { BodyIcon } from "@/components/showroom/BodyIcon";
import { GermanyMap } from "@/components/showroom/GermanyMap";
import { ControlBar } from "./ControlBar";

type Props = {
  draft: Draft;
  onChange: (next: Draft) => void;
  resolved: ResolvedInput;
  assumptions: Assumption[];
  /** No car falls inside the chosen budget window; what is shown is outside it. */
  budgetEmpty: boolean;
  results: CarResult[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onDismiss: (id: string) => void;
  onEdit: () => void;
  onReset: () => void;
};

function formatHours(min: number): string {
  const h = min / 60;
  if (h < 1) return `${Math.round(min)} Min`;
  return `${h.toLocaleString("de-DE", { maximumFractionDigits: 1 })} Std`;
}

function formatMidHours(mid: number): string {
  return `ca. ${formatHours(mid)}`;
}

function formatSpanFootnote(low: number, high: number): string {
  if (low === high) return formatHours(low);
  const a = formatHours(Math.min(low, high));
  const b = formatHours(Math.max(low, high));
  return `${a}–${b}`;
}

export function ResultView({
  draft,
  onChange,
  resolved,
  assumptions,
  budgetEmpty,
  results,
  selectedId,
  onSelect,
  onDismiss,
  onEdit,
  onReset,
}: Props) {
  const selected = results.find((r) => r.car.id === selectedId) ?? null;
  const tripKmVal = draft.tripKm ?? 80;
  const tripActive = draft.tripKm !== null && draft.tripKm >= 80;
  const monthSliderVal = draft.month ?? resolved.month;

  // SMARD's second manner: the cards are the picture, this table is the
  // evidence behind it — same figures, real markup, checkable.
  const [tableOpen, setTableOpen] = useState(false);
  const tableId = useId();

  // The engine already decided what was taken from the reader and what it had
  // to assume; the control bar only needs that verdict keyed by control.
  const assumedBy = useMemo(
    () =>
      Object.fromEntries(
        assumptions.map((a) => [a.key, a.assumed]),
      ) as Record<string, boolean>,
    [assumptions],
  );

  /* The map needs exactly one car. Fall back to the first so the check is
     useful before anything is chosen. */
  const detail = selected ?? results[0] ?? null;

  const compareCols = useMemo(
    () => (tripActive ? sortForCompare(results) : []),
    [tripActive, results],
  );

  return (
    <div className="space-y-10">
      {/* The inputs stay on screen and stay editable: every control carries its
          own value, and changing one redraws everything below it at once. */}
      <ControlBar
        draft={draft}
        onChange={onChange}
        assumedBy={assumedBy}
        resolvedDayKm={resolved.dayKm}
      />

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

      {budgetEmpty ? (
        /* Say it, rather than quietly showing cars outside the window and
           letting the reader assume they fit. */
        <p className="rounded-lg border border-line bg-accent-tint px-3 py-2 text-sm text-ink">
          {COPY.budgetEmptyNotice}
        </p>
      ) : null}

      <p className="text-sm text-muted">{COPY.skipCheck}</p>

      <ul className="grid gap-4 sm:grid-cols-3">
        {results.map((r) => {
          const active = selected?.car.id === r.car.id;
          return (
            <li key={r.car.id} className="relative">
              <button
                type="button"
                onClick={() => onSelect(r.car.id)}
                className={`w-full rounded-2xl border p-3 pr-10 text-left transition-colors ${
                  active
                    ? "border-gold bg-graphite-card"
                    : "border-graphite-line bg-graphite-soft hover:border-gold-dim"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="serif text-lg text-paper">
                      {formatCarName(r.car)}
                    </p>
                    <p className="mt-1 text-sm text-gold">
                      Autobahn-Reichweite{" "}
                      {formatRangeKm(r.range.lowKm, r.range.highKm)}
                    </p>
                  </div>
                  {/* The silhouette says "small / saloon / tall" faster than
                      the model name does, for a reader who does not yet know
                      these names. */}
                  <BodyIcon
                    body={r.car.body}
                    className="mt-0.5 h-7 w-auto shrink-0 text-muted"
                  />
                </div>
                {/* Directly under the range on purpose: the sentence says
                    "daraus ergibt sich die Reichweite oben", so nothing may sit
                    between the two or the word "oben" stops being true. A bare
                    kWh figure means nothing to someone buying their first EV. */}
                <p className="mt-2 text-sm text-muted">
                  <span className="tnum">
                    {formatDeUnit(r.car.usableKwh, "kWh", 1)}
                  </span>{" "}
                  {COPY.batteryHint}
                </p>
                <p className="mt-1 text-sm text-paper">{r.car.seats} Sitze</p>
                <p className="mt-1 text-sm text-muted">
                  {formatEUR(r.car.listEur)}
                </p>
                {r.priceOutlier ? (
                  <p className="mt-1 text-xs text-assumed">{COPY.priceOutlier}</p>
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
                className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-graphite-line bg-graphite-soft text-sm text-muted hover:border-gold hover:text-paper"
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

      <div>
        <button
          type="button"
          aria-expanded={tableOpen}
          aria-controls={tableId}
          onClick={() => setTableOpen((o) => !o)}
          className="min-h-10 rounded-full border border-graphite-line px-4 text-sm text-paper hover:border-gold"
        >
          {tableOpen ? "Tabelle ausblenden" : "Tabelle anzeigen"}
        </button>

        {tableOpen ? (
          <div
            id={tableId}
            className="mt-4 overflow-x-auto rounded-2xl border border-graphite-line bg-graphite-card"
          >
            <table className="w-full min-w-[32rem] border-collapse text-sm">
              <caption className="border-b border-graphite-line px-3 py-3 text-left text-sm text-paper">
                Die Zahlen hinter den Karten oben, je eine Spalte pro Auto.
                {tripActive ? (
                  <span className="mt-1 block text-xs font-normal text-muted">
                    Ladestopps und Gesamtzeit gelten für {draft.tripKm} km bei{" "}
                    {draft.speedKph} km/h.
                  </span>
                ) : null}
              </caption>
              <thead>
                <tr className="border-b border-graphite-line text-left">
                  <th
                    scope="col"
                    className="px-3 py-3 text-xs uppercase tracking-wide text-muted"
                  >
                    <span className="sr-only">Merkmal</span>
                  </th>
                  {results.map((r) => (
                    <th key={r.car.id} scope="col" className="px-3 py-3 align-bottom">
                      <span className="serif block text-base text-paper">
                        {formatCarName(r.car)}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-graphite-line">
                  <th scope="row" className="px-3 py-3 text-left text-muted">
                    Autobahn-Reichweite
                  </th>
                  {results.map((r) => (
                    <td key={r.car.id} className="px-3 py-3 text-paper">
                      <NumSpan low={r.range.lowKm} high={r.range.highKm} unit="km" />
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-graphite-line">
                  <th scope="row" className="px-3 py-3 text-left text-muted">
                    Listenpreis
                  </th>
                  {results.map((r) => (
                    <td key={r.car.id} className="px-3 py-3 text-paper">
                      <Num value={r.car.listEur} unit="€" />
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-graphite-line">
                  <th scope="row" className="px-3 py-3 text-left text-muted">
                    Sitze
                  </th>
                  {results.map((r) => (
                    <td key={r.car.id} className="px-3 py-3 text-paper">
                      <Num value={r.car.seats} />
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-graphite-line">
                  <th scope="row" className="px-3 py-3 text-left text-muted">
                    Nutzbare Batterie
                  </th>
                  {results.map((r) => (
                    <td key={r.car.id} className="px-3 py-3 text-paper">
                      <Num value={r.car.usableKwh} unit="kWh" decimals={1} />
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-graphite-line">
                  <th scope="row" className="px-3 py-3 text-left text-muted">
                    Verbrauch Autobahn
                  </th>
                  {results.map((r) => (
                    <td key={r.car.id} className="px-3 py-3 text-paper">
                      <Num value={r.car.highwayKwhPer100} unit="kWh/100 km" decimals={1} />
                    </td>
                  ))}
                </tr>
                <tr className={tripActive ? "border-b border-graphite-line" : undefined}>
                  <th scope="row" className="px-3 py-3 text-left text-muted">
                    DC-Ladeleistung
                  </th>
                  {results.map((r) => (
                    <td key={r.car.id} className="px-3 py-3 text-paper">
                      <Num value={r.car.dcPeakKw} unit="kW" />
                    </td>
                  ))}
                </tr>
                {tripActive ? (
                  <>
                    <tr className="border-b border-graphite-line">
                      <th scope="row" className="px-3 py-3 text-left text-muted">
                        {COPY.compareStops}
                      </th>
                      {results.map((r) => (
                        <td key={r.car.id} className="px-3 py-3 text-paper">
                          <Num value={r.trip.stops.length} />
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th scope="row" className="px-3 py-3 text-left font-medium text-paper">
                        {COPY.compareTotal}
                      </th>
                      {results.map((r) => (
                        <td key={r.car.id} className="px-3 py-3 text-paper">
                          {formatSpanFootnote(r.trip.totalSpan.low, r.trip.totalSpan.high)}
                        </td>
                      ))}
                    </tr>
                  </>
                ) : null}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {/*
        The Autobahn check is not behind a selection any more. Long distance is
        the reason this reader came, and gating it on a click they had no reason
        to make meant most of them never saw it. The trip, month and speed are
        one setting for the whole comparison anyway, not a property of one car.
        Only the per-car detail below still needs a car.
      */}
      <section className="space-y-6">
        {selected ? (
          <div>
            <h3 className="serif text-2xl text-paper sm:text-3xl">
              {formatCarName(selected.car)}
            </h3>
            <p className="mt-1 text-sm text-muted">
              Autobahn-Reichweite{" "}
              <span className="text-paper">
                {formatRangeKm(selected.range.lowKm, selected.range.highKm)}
              </span>
              {" · "}
              {formatEUR(selected.car.listEur)}
            </p>
            <p className="mt-1 text-sm text-paper">{selected.car.seats} Sitze</p>
          </div>
        ) : null}

          <div className="space-y-4 rounded-2xl border border-graphite-line bg-graphite-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="serif text-xl text-paper">{COPY.autobahnTitle}</h3>
                <p className="mt-1 text-sm text-muted">
                  {tripActive ? COPY.autobahnHint : COPY.skipCheck}
                </p>
              </div>
              <button
                type="button"
                /* Drops the trip only. It used to clear the car as well,
                   which made sense while the whole check hung off the
                   selection; now that would throw away an unrelated choice. */
                onClick={() => onChange({ ...draft, tripKm: null })}
                className="min-h-10 rounded-full border border-graphite-line px-4 text-sm text-muted hover:text-paper"
              >
                {COPY.skipTrip}
              </button>
            </div>

            {/* km slider is the opt-in; other knobs stay closed until tripKm is set */}
            <label className="block text-sm">
              <span className="text-muted">
                {COPY.qTrip} ·{" "}
                {draft.tripKm !== null ? `${draft.tripKm} km` : "noch offen"}
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

            {tripActive ? (
              <>
              <label className="block text-sm">
                <span className="text-muted">
                  {COPY.qMonth} ·{" "}
                  {draft.month !== null
                    ? MONTH_LABEL[draft.month]
                    : `angenommen: ${MONTH_LABEL[resolved.month]}`}
                </span>
                <input
                  type="range"
                  min={1}
                  max={12}
                  step={1}
                  className="mt-2 w-full"
                  value={monthSliderVal}
                  onChange={(e) =>
                    onChange({ ...draft, month: Number(e.target.value) })
                  }
                />
                <span className="mt-1 block text-xs text-muted">
                  {COPY.qMonthHint}
                  {draft.month === null ? ` ${COPY.qMonthEmpty}` : ""}
                </span>
              </label>

              <label className="block text-sm">
                <span className="text-muted">
                  {COPY.qSpeed} · {draft.speedKph} km/h
                </span>
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

              <label className="block text-sm">
                <span className="text-muted">
                  {COPY.qStart} · {Math.round(draft.startSoc * 100)} %
                </span>
                <input
                  type="range"
                  min={50}
                  max={100}
                  step={10}
                  className="mt-2 w-full"
                  value={Math.round(draft.startSoc * 100)}
                  onChange={(e) =>
                    onChange({
                      ...draft,
                      startSoc: Number(e.target.value) / 100,
                    })
                  }
                />
                <span className="mt-1 block text-xs text-muted">
                  {COPY.qStartHint}
                </span>
              </label>
              </>
            ) : null}
          </div>

          {tripActive ? (
            <div className="space-y-6">
              {/* Comparison table — all visible cars, sorted by stops then time */}
              <div className="overflow-x-auto rounded-2xl border border-graphite-line bg-graphite-card">
                <h3 className="serif border-b border-graphite-line px-3 py-3 text-xl text-paper">
                  {COPY.compareTitle}
                </h3>
                <table className="w-full min-w-[28rem] border-collapse text-sm">
                  <caption className="border-b border-graphite-line px-3 py-3 text-left text-sm text-paper">
                    {draft.month === null
                      ? `angenommen: ${MONTH_LABEL[resolved.month]}`
                      : MONTH_LABEL[draft.month]}{" "}
                    ·{" "}
                    {resolved.outdoorC.toLocaleString("de-DE", {
                      maximumFractionDigits: 1,
                    })}{" "}
                    °C · Start {Math.round(draft.startSoc * 100)} % ·{" "}
                    {draft.speedKph} km/h · {draft.tripKm} km
                    <span className="mt-1 block text-xs font-normal text-muted">
                      {COPY.tableWhen}
                    </span>
                  </caption>
                  <thead>
                    <tr className="border-b border-graphite-line text-left">
                      <th scope="col" className="px-3 py-3 text-xs uppercase tracking-wide text-muted">
                        <span className="sr-only">Merkmal</span>
                      </th>
                      {compareCols.map((r) => {
                        const isSel = r.car.id === selected?.car.id;
                        return (
                          <th
                            key={r.car.id}
                            scope="col"
                            aria-current={isSel ? "true" : undefined}
                            className={`px-3 py-3 align-bottom ${
                              isSel
                                ? "border-x-2 border-t-2 border-gold bg-graphite-soft"
                                : ""
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => onSelect(r.car.id)}
                              className="text-left"
                            >
                              <span className="serif block text-base text-paper">
                                {formatCarName(r.car)}
                              </span>
                            </button>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-graphite-line">
                      <th
                        scope="row"
                        className="px-3 py-3 text-left text-muted"
                      >
                        {COPY.compareStops}
                      </th>
                      {compareCols.map((r) => {
                        const isSel = r.car.id === selected?.car.id;
                        const n = r.trip.stops.length;
                        return (
                          <td
                            key={r.car.id}
                            aria-current={isSel ? "true" : undefined}
                            className={`px-3 py-3 text-paper ${
                              isSel
                                ? "border-x-2 border-gold bg-graphite-soft font-medium text-gold"
                                : ""
                            }`}
                          >
                            {n}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="border-b border-graphite-line">
                      <th
                        scope="row"
                        className="px-3 py-3 text-left text-muted"
                      >
                        {COPY.tripCharge}
                      </th>
                      {compareCols.map((r) => {
                        const isSel = r.car.id === selected?.car.id;
                        const mid = r.trip.extraSpan?.mid ?? r.trip.extraMin;
                        const lo = r.trip.extraSpan.low;
                        const hi = r.trip.extraSpan.high;
                        const spanNote =
                          lo === hi ? `${lo} Min` : `${lo}–${hi} Min`;
                        return (
                          <td
                            key={r.car.id}
                            aria-current={isSel ? "true" : undefined}
                            className={`px-3 py-3 ${
                              isSel
                                ? "border-x-2 border-gold bg-graphite-soft"
                                : ""
                            }`}
                          >
                            <div className="text-paper">
                              ca. {mid} Min
                            </div>
                            <div className="mt-0.5 text-xs text-muted">
                              {spanNote}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <th
                        scope="row"
                        className="px-3 py-3 text-left font-medium text-paper"
                      >
                        {COPY.compareTotal}
                      </th>
                      {compareCols.map((r) => {
                        const isSel = r.car.id === selected?.car.id;
                        const mid = tripTotalMid(r);
                        return (
                          <td
                            key={r.car.id}
                            aria-current={isSel ? "true" : undefined}
                            className={`px-3 py-3 ${
                              isSel
                                ? "border-x-2 border-b-2 border-gold bg-graphite-soft"
                                : ""
                            }`}
                          >
                            <div
                              className={`font-medium ${
                                isSel ? "text-gold" : "text-paper"
                              }`}
                            >
                              {formatMidHours(mid)}
                            </div>
                            <div className="mt-0.5 text-xs text-muted">
                              {formatSpanFootnote(
                                r.trip.totalSpan.low,
                                r.trip.totalSpan.high,
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
                <div className="space-y-1 border-t border-graphite-line px-3 py-2 text-xs text-muted">
                  <p>{COPY.spanNote}</p>
                  <p>{COPY.chargeWindow}</p>
                  {resolved.outdoorC < 10 ? (
                    <p>{COPY.precondAssumed}</p>
                  ) : null}
                </div>
              </div>

              {/* One route can only be drawn for one car. With nothing chosen
                  the first of the list stands in, named clearly, so the map is
                  never an empty box waiting for a click. */}
              {detail ? (
                <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
                  <GermanyMap
                    polyline={detail.trip.polyline}
                    routeKm={detail.trip.tripKm}
                    rangeMid={detail.trip.rangeMid}
                    stops={detail.trip.stops}
                  />
                  <div className="space-y-3 rounded-2xl border border-graphite-line bg-graphite-card p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-gold">
                      {formatCarName(detail.car)} · Strecke{" "}
                      {detail.trip.tripKm} km
                    </p>
                    {detail.trip.stops.length > 0 ? (
                      <ul className="space-y-1 text-sm text-muted">
                        {detail.trip.stops.map((s, i) => (
                          <li key={i}>
                            nach {s.afterKm} km · ca. {s.minutes} Min
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted">
                        Ohne Ladehalt auf dieser Strecke (mit Puffer).
                      </p>
                    )}
                    {!selected ? (
                      <p className="text-xs text-muted">{COPY.pickCarFirst}</p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
      </section>

      {results.length === 0 ? (
        <p className="text-muted">Mit diesen Angaben finden wir gerade kein Auto.</p>
      ) : null}

      {/* The "Nächster Schritt" card is hidden for now, by request. It asked the
          reader to go and note where they could charge — a homework assignment
          handed out before they have understood what they are looking at. The
          copy survives in COPY.morningStep; bring the card back once the result
          itself answers "what should I expect?" well enough that a next step
          reads as a natural move rather than an interruption. */}
      <p className="text-xs text-muted">{COPY.notCertified}</p>
    </div>
  );
}
