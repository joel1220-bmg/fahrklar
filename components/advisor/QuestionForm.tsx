"use client";

import {
  BODY_CHIP,
  CHARGE_CHIP,
  COPY,
  USE_CHIP,
} from "@/lib/copy";
import type {
  BodyStyle,
  ChargeOption,
  Draft,
  UseCase,
} from "@/lib/engine/types";
import { ChipGroup, Field, MultiChipGroup, inputClass } from "@/components/ui/ChipGroup";
import { RangeSlider } from "@/components/ui/RangeSlider";
import { priceBounds, priceWindowLabel } from "@/lib/engine/evaluate";

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

  /* One source for the stops, shared with the control bar on the result screen:
     a budget set here has to be expressible there and the other way round. */
  const PRICE = priceBounds();
  const formatEur = (n: number) => `${Math.round(n).toLocaleString("de-DE")} €`;

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
              {draft.dayUnknown ? "noch offen" : `${dayNum} km`}
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

      <MultiChipGroup<BodyStyle>
        legend={COPY.qBody}
        value={draft.bodies}
        onChange={(v) => set("bodies", v)}
        options={(Object.keys(BODY_CHIP) as BodyStyle[]).map((k) => ({
          value: k,
          label: BODY_CHIP[k],
        }))}
        unknownLabel={COPY.qDayUnknownChip}
        help={draft.bodies.length === 0 ? COPY.qBodyEmpty : COPY.qBodyHint}
      />

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
        <p className="mt-3 text-sm text-muted">
          {priceWindowLabel(draft.priceMin, draft.priceMax)}
        </p>
        <RangeSlider
          className="mt-1"
          min={PRICE.min}
          max={PRICE.max}
          step={1000}
          valueMin={draft.priceMin}
          valueMax={draft.priceMax}
          onChange={(next) =>
            onChange({ ...draft, priceMin: next.min, priceMax: next.max })
          }
          label="Kaufpreis"
          format={formatEur}
        />
        <div className="flex justify-between text-xs text-muted">
          <span className="tnum">{formatEur(PRICE.min)}</span>
          <span className="tnum">ab {formatEur(PRICE.max)}</span>
        </div>
        <button
          type="button"
          className="mt-2 min-h-11 text-sm text-muted underline hover:text-paper"
          onClick={() => onChange({ ...draft, priceMin: null, priceMax: null })}
        >
          {COPY.priceOpenLink}
        </button>
        {draft.priceMin === null && (draft.priceMax === null || draft.priceMax === 0) ? (
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
