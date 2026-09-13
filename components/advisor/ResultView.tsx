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
import { charge1080Min } from "@/lib/engine/charge";
import { Disclosure } from "@/components/ui/Disclosure";
import { tripMaxKm } from "@/lib/engine/evaluate";
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

  /* The one car the detail view speaks about: whichever was chosen, else the
     first of the list. It drives both the map and the highlighted column in the
     comparison, so those two can never disagree about which car is meant. */
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
                      {COPY.highwayRangeLabel}{" "}
                      {formatRangeKm(r.range.lowKm, r.range.highKm)}
                    </p>
                    {/* The same battery goes further in town. Showing only the
                        motorway span answers the long-distance worry and hides
                        the drive this reader actually does most days. */}
                    <p className="mt-0.5 text-sm text-muted">
                      {COPY.cityRangeLabel}{" "}
                      {formatRangeKm(r.cityRange.lowKm, r.cityRange.highKm)}
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
                {/* Directly under both ranges on purpose: the sentence says
                    "daraus ergeben sich die beiden Reichweiten oben", so nothing
                    may sit between them or the word "oben" stops being true. A
                    bare kWh figure means nothing to someone buying their first
                    electric car. */}
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
              {/* Red, and big enough to hit. It was grey and set in the
                  smallest type on the page, so the one control that changes
                  the selection looked like a caption. Red says "this does
                  something" before anyone reads the words. */}
              <button
                type="button"
                onClick={() => onDismiss(r.car.id)}
                className="mt-2 min-h-11 w-full text-center text-sm font-medium text-danger underline underline-offset-2 hover:text-danger-strong"
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
                    {COPY.highwayRangeLabel}
                  </th>
                  {results.map((r) => (
                    <td key={r.car.id} className="px-3 py-3 text-paper">
                      <NumSpan low={r.range.lowKm} high={r.range.highKm} unit="km" />
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-graphite-line">
                  <th scope="row" className="px-3 py-3 text-left text-muted">
                    {COPY.cityRangeLabel}
                  </th>
                  {results.map((r) => (
                    <td key={r.car.id} className="px-3 py-3 text-paper">
                      <NumSpan
                        low={r.cityRange.lowKm}
                        high={r.cityRange.highKm}
                        unit="km"
                      />
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
                    {COPY.batteryLabel}
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
                {/* Time first, peak second. ladekurve-lock.md calls dcPeakKw
                    "nur Referenz, nie Zeitbasis", and this table is exactly
                    where a reader would otherwise compare by it. */}
                <tr className="border-b border-graphite-line">
                  <th scope="row" className="px-3 py-3 text-left text-muted">
                    {COPY.charge1080Label}
                  </th>
                  {results.map((r) => {
                    const m = charge1080Min(r.car, resolved.outdoorC);
                    return (
                      <td key={r.car.id} className="px-3 py-3 text-paper">
                        <NumSpan low={m.low} high={m.high} unit="Min" />
                      </td>
                    );
                  })}
                </tr>
                <tr className={tripActive ? "border-b border-graphite-line" : undefined}>
                  <th scope="row" className="px-3 py-3 text-left text-muted">
                    {COPY.peakLabel}
                  </th>
                  {results.map((r) => (
                    <td key={r.car.id} className="px-3 py-3 text-assumed">
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

          {/* The knobs are a toolbar, the map and the table are the two things
              they change. Reading it that way lets all three share one screen:
              a flat strip of controls on top, the two outputs side by side
              underneath. The earlier arrangement stacked map under sliders in
              one column, which made that column 485px tall on its own and
              pushed the comparison off the fold. */}
          <div className="space-y-3 rounded-2xl border border-graphite-line bg-graphite-card p-3.5">
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
            {/* Question and value on separate lines. Joined by a middle dot on
                one line, the value's length decided where the question wrapped,
                so picking December made the whole toolbar re-flow and the
                blocks below jump. The question is fixed text and now wraps the
                same way whatever the value says. */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block text-sm">
              <span className="block text-muted">{COPY.qTrip}</span>
              <span className="mt-0.5 block font-medium text-ink tnum">
                {draft.tripKm !== null ? `${draft.tripKm} km` : "noch offen"}
              </span>
              <input
                type="range"
                min={80}
                /* Never offer a distance the sketch corridor cannot draw:
                   the slider used to end at 900 while the corridor stopped at
                   790, so the line simply stopped growing past that. */
                max={tripMaxKm()}
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
              /* Month, speed and state of charge side by side. Stacked they
                 pushed the comparison table off the fold, and the point of
                 putting the map here was that a reader can watch these three
                 change it without scrolling. */
              <>
              <label className="block text-sm">
                <span className="block text-muted">{COPY.qMonth}</span>
                <span
                  className={`mt-0.5 block font-medium ${
                    draft.month !== null ? "text-ink" : "italic text-assumed"
                  }`}
                >
                  {MONTH_LABEL[draft.month ?? resolved.month]}
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
                <span className="block text-muted">{COPY.qSpeed}</span>
                <span className="mt-0.5 block font-medium text-ink tnum">
                  {draft.speedKph} km/h
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
                <span className="mt-1 block text-xs text-muted">
                  {COPY.qSpeedHint}
                </span>
              </label>

              <label className="block text-sm">
                <span className="block text-muted">{COPY.qStart}</span>
                <span className="mt-0.5 block font-medium text-ink tnum">
                  {Math.round(draft.startSoc * 100)} %
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
          </div>

          {/* Flex with standard width classes rather than an arbitrary grid
              template: Turbopack twice failed to regenerate the CSS for a
              changed arbitrary value, and the map silently rendered at full
              page width. w-80 and max-w-xs are always in the stylesheet. */}
          {tripActive ? (
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          {detail ? (
            <div className="space-y-2 lg:w-80 lg:shrink-0">
              {/* One route can only be drawn for one car. With nothing chosen
                  the first of the list stands in, named clearly, so the map is
                  never an empty box waiting for a click. */}
              <GermanyMap
                polyline={detail.trip.polyline}
                routeKm={detail.trip.tripKm}
                rangeMid={detail.trip.rangeMid}
                stops={detail.trip.stops}
              />
              {/* The written-out stop list is gone: the map already marks every
                  halt with its minutes, and the caption counts them. Repeating
                  it underneath said the same thing twice and cost the height
                  that put map and comparison side by side. Only the two things
                  the map cannot say for itself are left. */}
              <p className="px-1 text-xs uppercase tracking-[0.14em] text-gold">
                {formatCarName(detail.car)} · Strecke {detail.trip.tripKm} km
              </p>
              {detail.trip.stops.length === 0 ? (
                <p className="px-1 text-sm text-muted">
                  Ohne Ladehalt auf dieser Strecke (mit Puffer).
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-3 lg:min-w-0 lg:flex-1">
              {/* Comparison table — all visible cars, sorted by stops then time */}
              <div className="overflow-x-auto rounded-2xl border border-graphite-line bg-graphite-card">
                <h3 className="serif border-b border-graphite-line px-3 py-2.5 text-lg text-paper">
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
                        const isSel = r.car.id === detail?.car.id;
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
                        const isSel = r.car.id === detail?.car.id;
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
                        const isSel = r.car.id === detail?.car.id;
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
                        const isSel = r.car.id === detail?.car.id;
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
                  {/* Folded away rather than deleted. Every one of these
                      sentences names an uncertainty the result depends on, so
                      dropping them would quietly turn spans into promises. Open
                      they were a wall of small print under the numbers. */}
                  <Disclosure summary={COPY.methodSummary} panelClassName="space-y-1 pt-2">
                    <p>{COPY.spanNote}</p>
                    <p>{COPY.batteryTableHint}</p>
                    <p>{COPY.cityRangeHint}</p>
                    <p>{COPY.peakHint}</p>
                    <p>{COPY.chargeWindow}</p>
                    {resolved.outdoorC < 10 ? <p>{COPY.precondAssumed}</p> : null}
                  </Disclosure>
                </div>
              </div>

          </div>
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
