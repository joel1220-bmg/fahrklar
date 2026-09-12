"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { BODY_CHIP, CHARGE_CHIP, USE_CHIP } from "@/lib/copy";
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

const USE_ORDER: UseCase[] = ["everyday", "family", "highway", "mixed"];
const BODY_ORDER: BodyStyle[] = ["hatch", "sedan", "crossover"];
const CHARGE_ORDER: ChargeOption[] = ["home", "work", "public", "unknown"];

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

  const bodyValue =
    draft.bodies.length === 0
      ? "alle Formen"
      : draft.bodies.map((b) => BODY_CHIP[b]).join(", ");

  const priceValue =
    draft.priceMax && draft.priceMax > 0
      ? `bis ${Math.round(draft.priceMax).toLocaleString("de-DE")} €`
      : "offen";

  const toggleBody = (b: BodyStyle) =>
    set({
      bodies: draft.bodies.includes(b)
        ? draft.bodies.filter((x) => x !== b)
        : [...draft.bodies, b],
    });

  return (
    <section
      aria-label="Angaben ändern"
      className="no-print sticky top-0 z-20 -mx-4 border-b border-line bg-canvas/95 px-4 py-3 backdrop-blur-sm"
    >
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <Control
          label="Nutzung"
          value={USE_CHIP[draft.use ?? "everyday"]}
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
                  Weiß ich nicht
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
          value={CHARGE_CHIP[draft.charge ?? "unknown"]}
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
              <label className="block text-sm text-ink">
                Obergrenze Listenpreis
                <input
                  type="range"
                  min={25000}
                  max={90000}
                  step={1000}
                  value={draft.priceMax && draft.priceMax > 0 ? draft.priceMax : 90000}
                  onChange={(e) => set({ priceMax: Number(e.target.value) })}
                  className="mt-2 w-full"
                />
              </label>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="tnum text-ink">{priceValue}</span>
                <button
                  type="button"
                  onClick={() => set({ priceMax: null })}
                  className="text-accent underline underline-offset-2"
                >
                  offen lassen
                </button>
              </div>
            </div>
          )}
        </Control>
      </div>
    </section>
  );
}
