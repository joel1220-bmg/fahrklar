"use client";

import type { ReactNode } from "react";

export function ChipGroup<T extends string>({
  legend,
  value,
  onChange,
  options,
  help,
}: {
  legend: string;
  value: T | null;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  help?: string;
}) {
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
