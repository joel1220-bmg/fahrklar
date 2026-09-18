"use client";

import type { ReactNode } from "react";

export function ChipGroup<T extends string>({
  legend,
  value,
  onChange,
  options,
  help,
  unknownLabel,
}: {
  legend: string;
  value: T | null;
  onChange: (v: T | null) => void;
  options: { value: T; label: string }[];
  help?: string;
  /**
   * Adds a chip that puts the answer back to null, the way MultiChipGroup's
   * already does. Added 18.09.2026: the landing page promises that
   * "Weiß ich nicht" is always allowed, and the very first question was the
   * one place in the intake that did not offer it.
   *
   * Null, not a new union member. `lib/copy.ts` carried a note proposing that
   * `UseCase` grow an "unknown" variant, with every consumer changed in the
   * same commit. That is the more dangerous of the two routes and it is not
   * needed: `Draft.use` is already `UseCase | null`, and null already means
   * "assumed" to the engine, the schema, the stored draft and the marker in
   * the control bar. This chip only gives the reader a way back to a state
   * the whole chain already understands.
   */
  unknownLabel?: string;
}) {
  const unknownSelected = value === null;
  return (
    <fieldset className="min-w-0">
      <legend className="serif text-lg text-ink">{legend}</legend>
      <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label={legend}>
        {options.map((o) => {
          const selected = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(o.value)}
              className={`min-h-11 rounded-full border px-3.5 text-sm transition-colors ${
                selected
                  ? "border-accent bg-accent font-medium text-white"
                  : "border-line bg-surface text-ink hover:border-accent hover:text-accent"
              }`}
            >
              {o.label}
            </button>
          );
        })}
        {unknownLabel ? (
          <button
            type="button"
            role="radio"
            aria-checked={unknownSelected}
            onClick={() => onChange(null)}
            className={`min-h-11 rounded-full border px-3.5 text-sm transition-colors ${
              unknownSelected
                ? "border-accent bg-accent font-medium text-white"
                : "border-line bg-surface text-ink hover:border-accent hover:text-accent"
            }`}
          >
            {unknownLabel}
          </button>
        ) : null}
      </div>
      {help ? <p className="mt-2 text-sm text-muted">{help}</p> : null}
    </fieldset>
  );
}

/** Multi-select chips: empty selection allowed; click toggles membership. */
export function MultiChipGroup<T extends string>({
  legend,
  value,
  onChange,
  options,
  help,
  unknownLabel,
}: {
  legend: string;
  value: T[];
  onChange: (v: T[]) => void;
  options: { value: T; label: string }[];
  help?: string;
  /** Clears selection (empty = all / assumed). Selected when value is empty. */
  unknownLabel?: string;
}) {
  const toggle = (v: T) => {
    if (value.includes(v)) onChange(value.filter((x) => x !== v));
    else onChange([...value, v]);
  };

  const unknownSelected = value.length === 0;

  return (
    <fieldset className="min-w-0">
      <legend className="serif text-lg text-ink">{legend}</legend>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={legend}>
        {options.map((o) => {
          const selected = value.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(o.value)}
              className={`min-h-11 rounded-full border px-3.5 text-sm transition-colors ${
                selected
                  ? "border-accent bg-accent font-medium text-white"
                  : "border-line bg-surface text-ink hover:border-accent hover:text-accent"
              }`}
            >
              {o.label}
            </button>
          );
        })}
        {unknownLabel ? (
          <button
            type="button"
            aria-pressed={unknownSelected}
            onClick={() => onChange([])}
            className={`min-h-11 rounded-full border px-3.5 text-sm transition-colors ${
              unknownSelected
                ? "border-accent bg-accent font-medium text-white"
                : "border-line bg-surface text-ink hover:border-accent hover:text-accent"
            }`}
          >
            {unknownLabel}
          </button>
        ) : null}
      </div>
      {help ? <p className="mt-2 text-sm text-muted">{help}</p> : null}
    </fieldset>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <div className="mt-1">{children}</div>
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "min-h-11 w-full rounded-lg border border-line bg-surface px-3 text-base text-ink tnum placeholder:text-muted focus:border-accent";
