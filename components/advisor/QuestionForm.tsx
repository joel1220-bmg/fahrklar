"use client";

import {
  CHARGE_CHIP,
  COPY,
  MONTH_LABEL,
  USE_CHIP,
} from "@/lib/copy";
import type {
  ChargeOption,
  Draft,
  UseCase,
} from "@/lib/engine/types";
import { ChipGroup, Field, inputClass } from "@/components/ui/ChipGroup";

type Props = {
  draft: Draft;
  onChange: (next: Draft) => void;
  remember: boolean;
  onRemember: (on: boolean) => void;
  onSubmit: () => void;
};

export function QuestionForm({ draft, onChange, remember, onRemember, onSubmit }: Props) {
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    onChange({ ...draft, [key]: value });

  const dayNum = draft.dayUnknown
    ? 50
    : Math.min(200, Math.max(10, Number(draft.dayKm) || 50));

  const priceVal = draft.priceMax && draft.priceMax > 0 ? draft.priceMax : 0;

  return (
    <form
      className="space-y-10"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <ChipGroup<UseCase>
        legend={COPY.qUse}
        value={draft.use}
        onChange={(v) => set("use", v)}
        options={(Object.keys(USE_CHIP) as UseCase[]).map((k) => ({
          value: k,
          label: USE_CHIP[k],
        }))}
        help={draft.use === null ? COPY.qUseEmpty : undefined}
      />

      <fieldset>
        <legend className="serif text-lg text-paper">{COPY.qDay}</legend>
        <p className="mt-2 text-sm text-muted">{COPY.qDayHint}</p>
        <div className="mt-3 space-y-3">
          <label className="block text-sm">
            <span className="text-muted">
              {draft.dayUnknown ? "—" : `${dayNum} km`}
            </span>
            <input
              type="range"
              min={10}
              max={200}
              step={5}
              className="mt-2 w-full"
              disabled={draft.dayUnknown}
              value={dayNum}
              onChange={(e) =>
                onChange({
                  ...draft,
                  dayKm: String(Number(e.target.value)),
                  dayUnknown: false,
                })
              }
            />
          </label>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Kilometer">
              <input
                className={`${inputClass} max-w-[8rem]`}
                inputMode="decimal"
                placeholder={COPY.qDayPlaceholder}
                value={draft.dayUnknown ? "" : draft.dayKm}
                disabled={draft.dayUnknown}
                onChange={(e) =>
                  onChange({ ...draft, dayKm: e.target.value, dayUnknown: false })
                }
              />
            </Field>
            <button
              type="button"
              role="radio"
              aria-checked={draft.dayUnknown}
              onClick={() => onChange({ ...draft, dayUnknown: true, dayKm: "" })}
              className={`min-h-11 rounded-full border px-3.5 text-sm ${
                draft.dayUnknown
                  ? "border-gold bg-gold text-graphite"
                  : "border-graphite-line bg-graphite-card text-paper hover:border-gold-dim"
              }`}
            >
              {COPY.qDayUnknownChip}
            </button>
          </div>
        </div>
        {!draft.dayKm && !draft.dayUnknown ? (
          <p className="mt-2 text-sm text-muted">{COPY.qDayEmpty}</p>
        ) : null}
      </fieldset>

      <fieldset>
        <legend className="serif text-lg text-paper">{COPY.qMonth}</legend>
        <p className="mt-2 text-sm text-muted">{COPY.qMonthHint}</p>
        <label className="mt-3 block text-sm">
          <span className="text-gold">
            {draft.month !== null
              ? MONTH_LABEL[draft.month]
              : "—"}
          </span>
          <input
            type="range"
            min={1}
            max={12}
            step={1}
            className="mt-2 w-full"
            value={draft.month ?? new Date().getMonth() + 1}
            onChange={(e) => set("month", Number(e.target.value))}
          />
        </label>
        {draft.month === null ? (
          <p className="mt-2 text-sm text-muted">{COPY.qMonthEmpty}</p>
        ) : null}
      </fieldset>

      <ChipGroup<ChargeOption>
        legend={COPY.qCharge}
        value={draft.charge}
        onChange={(v) => set("charge", v)}
        options={(Object.keys(CHARGE_CHIP) as ChargeOption[]).map((k) => ({
          value: k,
          label: CHARGE_CHIP[k],
        }))}
        help={
          draft.charge === null
            ? COPY.qChargeEmpty
            : draft.charge === "home"
              ? COPY.qChargeHomeHint
              : undefined
        }
      />

      <fieldset>
        <legend className="serif text-lg text-paper">{COPY.qPrice}</legend>
        <p className="mt-2 text-sm text-muted">{COPY.qPriceHint}</p>
        <label className="mt-3 block text-sm">
          <span className="text-muted">
            {priceVal > 0
              ? `bis ${priceVal.toLocaleString("de-DE")} €`
              : "offen"}
          </span>
          <input
            type="range"
            min={28000}
            max={75000}
            step={1000}
            className="mt-2 w-full"
            value={priceVal > 0 ? priceVal : 50000}
            onChange={(e) => set("priceMax", Number(e.target.value))}
          />
        </label>
        <button
          type="button"
          className="mt-2 text-sm text-muted underline hover:text-paper"
          onClick={() => set("priceMax", null)}
        >
          Budget offen lassen
        </button>
        {draft.priceMax === null || draft.priceMax === 0 ? (
          <p className="mt-2 text-sm text-muted">{COPY.qPriceEmpty}</p>
        ) : null}
      </fieldset>

      <div className="space-y-2 rounded-2xl border border-graphite-line bg-graphite-card p-4">
        <label className="flex items-start gap-3 text-sm text-paper">
          <input
            type="checkbox"
            className="mt-1"
            checked={remember}
            onChange={(e) => onRemember(e.target.checked)}
          />
          <span>
            {COPY.remember}
            {!remember ? (
              <span className="mt-1 block text-muted">{COPY.rememberOff}</span>
            ) : null}
          </span>
        </label>
      </div>

      <div>
        <button
          type="submit"
          className="inline-flex min-h-12 items-center rounded-full bg-gold px-6 text-base font-semibold text-graphite hover:bg-gold-dim"
        >
          {COPY.submit}
        </button>
        <p className="mt-2 text-xs text-muted">{COPY.privacy}</p>
      </div>
    </form>
  );
}
