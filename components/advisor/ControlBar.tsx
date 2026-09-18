"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { BODY_CHIP, CHARGE_CHIP, COPY, USE_CHIP } from "@/lib/copy";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { priceBounds, priceWindowLabel } from "@/lib/engine/evaluate";
import type { BodyStyle, ChargeOption, Draft, UseCase } from "@/lib/engine/types";

/**
 * The inputs stay on screen and stay editable, after smard.de: every control
 * carries its own current value ("Laden: Zu Hause"), and changing one redraws
 * the result underneath straight away. The previous flow put these behind a
 * "Feinschliff" drawer, which hid the fact that the answer depends on them.
 *
 * A value the engine assumed rather than took from the user is marked here as
 * well — the same distinction the result already draws, but in the one place
 * where the reader can actually correct it.
 */

const USE_ORDER: UseCase[] = ["city", "cityTrips", "longDistance"];
const BODY_ORDER: BodyStyle[] = ["hatch", "compact", "kombi", "sedan", "crossover"];
const CHARGE_ORDER: ChargeOption[] = ["home", "work", "public", "unknown"];

/* Slider stops come from the catalogue, not from a number typed here: the
   intake form uses the same ones, so a budget set on one screen can always be
   expressed on the other. Sitting on a stop means "open at that end", not
   "exactly this much" - otherwise a reader could never take a limit off
   again. */

function Chevron() {
  return (
    <svg aria-hidden viewBox="0 0 10 6" className="h-1.5 w-2.5 shrink-0">
      <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/** One labelled dropdown: "Nutzung: Alltag" opening a panel of options. */
function Control({
  label,
  value,
  assumed,
  children,
}: {
  label: string;
  value: string;
  assumed: boolean;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((o) => !o)}
        className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-lg border bg-surface px-3 text-left text-sm transition-colors ${
          open ? "border-accent" : "border-line hover:border-accent"
        }`}
      >
        <span className="min-w-0 truncate">
          <span className="text-muted">{label}: </span>
          <span className={assumed ? "italic text-assumed" : "font-medium text-ink"}>
            {value}
          </span>
        </span>
        <span className="text-muted">
          <Chevron />
        </span>
      </button>

      {open ? (
        <div
          id={panelId}
          className="absolute left-0 top-[calc(100%+0.25rem)] z-30 w-max min-w-full max-w-[min(20rem,calc(100vw-2rem))] rounded-lg border border-line bg-surface p-3 shadow-lg"
        >
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  );
}

function OptionButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-9 rounded-full border px-3 text-sm transition-colors ${
        selected
          ? "border-accent bg-accent font-medium text-white"
          : "border-line bg-surface text-ink hover:border-accent hover:text-accent"
      }`}
    >
      {children}
    </button>
  );
}

type Props = {
  draft: Draft;
  onChange: (next: Draft) => void;
  /** assumed-flags from the engine, keyed as in buildAssumptions() */
  assumedBy: Record<string, boolean>;
  /** engine-resolved day distance, so the slider shows the assumed value too */
  resolvedDayKm: number;
};

export function ControlBar({ draft, onChange, assumedBy, resolvedDayKm }: Props) {
  const set = (patch: Partial<Draft>) => onChange({ ...draft, ...patch });
  const PRICE = priceBounds();
  /* Phone only. See the wrapper below for why. */
  const [openOnPhone, setOpenOnPhone] = useState(false);
  const gridId = useId();

  const bodyValue =
    draft.bodies.length === 0
      ? "alle Formen"
      : draft.bodies.map((b) => BODY_CHIP[b]).join(", ");

  // Mirror resolveDraft(): no answer and "Noch unklar" are both computed with
  // public charging, so that is the value the control has to show — marked as
  // assumed, in the one place where it can be corrected.
  const chargeValue: ChargeOption =
    draft.charge === null || draft.charge === "unknown" ? "public" : draft.charge;

  const priceValue = priceWindowLabel(draft.priceMin, draft.priceMax);

  const toggleBody = (b: BodyStyle) =>
    set({
      bodies: draft.bodies.includes(b)
        ? draft.bodies.filter((x) => x !== b)
        : [...draft.bodies, b],
    });

  /* One line of the current answers, for the collapsed state on a phone.
     Without it the trigger would be a button that hides five values and
     names none of them. */
  const summary = [
    USE_CHIP[draft.use ?? "city"],
    `${Math.round(resolvedDayKm)} km`,
    bodyValue,
    CHARGE_CHIP[chargeValue],
    priceValue,
  ].join(" · ");

  return (
    <section
      /* "Ihre Angaben", not "Angaben ändern". `COPY.editQuestions` already
         puts a button reading "Angaben ändern" on the same screen, and that
         one goes back to the full intake form while this region edits in
         place. Two controls with one name doing two things is the confusion,
         renamed 18.09.2026 when the collapsed trigger below made them sit
         four centimetres apart on a phone. */
      aria-label="Ihre Angaben"
      /* Pinned from sm up. Stacked one-per-row on a phone the bar is ~300 px
         tall, and pinning that would eat a third of the viewport for good. */
      className="no-print z-20 -mx-4 border-b border-line bg-canvas/95 px-4 py-3 backdrop-blur-sm sm:sticky sm:top-0"
    >
      {/*
        Collapsed by default on a phone, always open from `sm` up.

        Measured 18.09.2026 on the live site at 390 px: this bar was 297 px of
        the 924 px a reader had to scroll past before the first car appeared,
        which is more than a whole screen of preamble on the page that is
        supposed to answer their question. Folded away it costs one 44 px row.

        It stays open on every wider screen on purpose. The whole point of the
        smard.de arrangement is that the controls are visible and the result
        moves when you touch them; a drawer would undo that. That requirement
        is also why this is plain CSS rather than the `Disclosure` component,
        which mounts its children only while open - the grid has to stay in
        the DOM so `sm:grid` can show it without JavaScript deciding anything.
      */}
      <button
        type="button"
        aria-expanded={openOnPhone}
        aria-controls={gridId}
        onClick={() => setOpenOnPhone((o) => !o)}
        className="flex min-h-11 w-full items-center justify-between gap-2 text-left text-sm text-ink sm:hidden"
      >
        <span className="min-w-0 truncate">
          <span className="text-muted">Ihre Angaben</span>{" "}
          <span className="text-ink">{summary}</span>
        </span>
        <Chevron />
      </button>
      <div
        id={gridId}
        className={`${openOnPhone ? "grid" : "hidden"} gap-2 sm:grid sm:grid-cols-2 lg:grid-cols-5`}
      >
        <Control
          label="Nutzung"
          value={USE_CHIP[draft.use ?? "city"]}
          assumed={!!assumedBy.use}
        >
          {(close) => (
            <div className="flex flex-wrap gap-2">
              {USE_ORDER.map((u) => (
                <OptionButton
                  key={u}
                  selected={draft.use === u}
                  onClick={() => {
                    set({ use: u });
                    close();
                  }}
                >
                  {USE_CHIP[u]}
                </OptionButton>
              ))}
              {/* Same chip the intake offers since 18.09.2026. A reader who
                  can say "weiß ich nicht" on the form but cannot take the
                  answer back here would be stuck with a guess they never
                  made. */}
              <OptionButton
                selected={draft.use === null}
                onClick={() => {
                  set({ use: null });
                  close();
                }}
              >
                {COPY.qDayUnknownChip}
              </OptionButton>
            </div>
          )}
        </Control>

        <Control
          label="Normaler Tag"
          value={`${Math.round(resolvedDayKm)} km`}
          assumed={!!assumedBy.day}
        >
          {() => (
            <div>
              <label className="block text-sm text-ink">
                Kilometer hin und zurück
                <input
                  type="range"
                  min={10}
                  max={200}
                  step={5}
                  value={Math.round(resolvedDayKm)}
                  onChange={(e) => set({ dayKm: e.target.value, dayUnknown: false })}
                  className="mt-2 w-full"
                />
              </label>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="tnum text-ink">{Math.round(resolvedDayKm)} km</span>
                <button
                  type="button"
                  onClick={() => set({ dayKm: "", dayUnknown: true })}
                  className="text-accent underline underline-offset-2"
                >
                  {COPY.qDayUnknownChip}
                </button>
              </div>
            </div>
          )}
        </Control>

        <Control label="Form" value={bodyValue} assumed={!!assumedBy.body}>
          {() => (
            <div>
              <div className="flex flex-wrap gap-2">
                {BODY_ORDER.map((b) => (
                  <OptionButton
                    key={b}
                    selected={draft.bodies.includes(b)}
                    onClick={() => toggleBody(b)}
                  >
                    {BODY_CHIP[b]}
                  </OptionButton>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">
                Mehrere möglich. Nichts gewählt = alle Formen.
              </p>
            </div>
          )}
        </Control>

        <Control
          label="Laden"
          value={CHARGE_CHIP[chargeValue]}
          assumed={!!assumedBy.charge}
        >
          {(close) => (
            <div className="flex flex-wrap gap-2">
              {CHARGE_ORDER.map((c) => (
                <OptionButton
                  key={c}
                  selected={draft.charge === c}
                  onClick={() => {
                    set({ charge: c });
                    close();
                  }}
                >
                  {CHARGE_CHIP[c]}
                </OptionButton>
              ))}
            </div>
          )}
        </Control>

        <Control label="Kaufpreis" value={priceValue} assumed={!!assumedBy.price}>
          {() => (
            <div>
              {/* One range with two handles. Both ends may be left open: a
                  handle parked on its stop means "no limit on this side", so a
                  reader who once set a ceiling can always take it off again. */}
              <RangeSlider
                min={PRICE.min}
                max={PRICE.max}
                step={1000}
                valueMin={draft.priceMin}
                valueMax={draft.priceMax}
                onChange={(next) => set({ priceMin: next.min, priceMax: next.max })}
                label="Kaufpreis"
                format={(n) => `${Math.round(n).toLocaleString("de-DE")} €`}
              />
              <div className="flex justify-between text-xs text-muted">
                <span className="tnum">
                  {PRICE.min.toLocaleString("de-DE")} €
                </span>
                <span className="tnum">
                  ab {PRICE.max.toLocaleString("de-DE")} €
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                <span className="tnum text-ink">{priceValue}</span>
                <button
                  type="button"
                  onClick={() => set({ priceMin: null, priceMax: null })}
                  className="shrink-0 text-accent underline underline-offset-2"
                >
                  {COPY.priceOpenLink}
                </button>
              </div>
            </div>
          )}
        </Control>
      </div>
      <p className={`mt-2 text-xs text-muted ${openOnPhone ? "" : "hidden"} sm:block`}>
        {COPY.assumedBanner}
      </p>
    </section>
  );
}
