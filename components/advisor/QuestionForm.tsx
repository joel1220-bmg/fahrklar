"use client";

import {
  CHARGE_CHIP,
  COPY,
  LONG_CHIP,
  MONTH_LABEL,
  PRICE_CHIP,
  USE_CHIP,
} from "@/lib/copy";
import type {
  ChargeOption,
  Draft,
  LongTrip,
  PriceOption,
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
        <div className="mt-3 flex flex-wrap items-end gap-3">
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
        {!draft.dayKm && !draft.dayUnknown ? (
          <p className="mt-2 text-sm text-muted">{COPY.qDayEmpty}</p>
        ) : null}
      </fieldset>

      <ChipGroup<LongTrip>
        legend={COPY.qLong}
        value={draft.longTrip}
        onChange={(v) => set("longTrip", v)}
        options={(Object.keys(LONG_CHIP) as LongTrip[]).map((k) => ({
          value: k,
          label: LONG_CHIP[k],
        }))}
        help={draft.longTrip === null ? COPY.qLongEmpty : COPY.qLongHint}
      />

      <fieldset>
        <legend className="serif text-lg text-paper">{COPY.qMonth}</legend>
        <p className="mt-2 text-sm text-muted">{COPY.qMonthHint}</p>
        <select
          className={`${inputClass} mt-3 max-w-xs`}
          value={draft.month ?? ""}
          onChange={(e) =>
            set("month", e.target.value === "" ? null : Number(e.target.value))
          }
        >
          <option value="" />
          {Object.entries(MONTH_LABEL).map(([n, label]) => (
            <option key={n} value={n}>
              {label}
            </option>
          ))}
        </select>
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

      <ChipGroup<PriceOption>
        legend={COPY.qPrice}
        value={draft.price}
        onChange={(v) => set("price", v)}
        options={(Object.keys(PRICE_CHIP) as PriceOption[]).map((k) => ({
          value: k,
          label: PRICE_CHIP[k],
        }))}
        help={draft.price === null ? COPY.qPriceEmpty : COPY.qPriceHint}
      />

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
