"use client";

import { useEffect, useMemo, useState } from "react";
import { COPY } from "@/lib/copy";
import { evaluateCars } from "@/lib/engine/evaluate";
import { emptyDraft, type Draft } from "@/lib/engine/types";
import {
  clearDraft,
  loadDraft,
  loadRemember,
  saveDraft,
  setRemember as persistRemember,
} from "@/lib/storage";
import { QuestionForm } from "./QuestionForm";
import { ResultView } from "./ResultView";

export function AdvisorApp() {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [remember, setRememberState] = useState(false);
  const [phase, setPhase] = useState<"form" | "result">("form");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  /*
   * Reading localStorage has to happen after mount, not during render: the
   * server has no such store, so using it while rendering would make the first
   * client render disagree with the server HTML. That is exactly the shape
   * react-hooks/set-state-in-effect warns about, and exactly the case where it
   * is the correct thing to do — so the rule is disabled here, deliberately,
   * rather than the effect being contorted to hide from it.
   */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const rem = loadRemember();
    setRememberState(rem);
    const saved = loadDraft();
    if (saved) setDraft(saved);
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated) return;
    if (remember) saveDraft(draft);
  }, [draft, remember, hydrated]);

  const evaluation = useMemo(() => evaluateCars(draft), [draft]);

  const visible = useMemo(() => {
    const dismissed = new Set(dismissedIds);
    return evaluation.results.filter((r) => !dismissed.has(r.car.id)).slice(0, 4);
  }, [evaluation.results, dismissedIds]);

  /*
   * A selection only counts while the car is still on screen — change a filter
   * and the chosen car can drop out of the visible three. That is derived
   * state, so it is derived here during render rather than corrected afterwards
   * in an effect: an effect would render one frame with a selection pointing at
   * a car that is no longer shown.
   */
  const activeId =
    selectedId && visible.some((r) => r.car.id === selectedId) ? selectedId : null;

  const onRemember = (on: boolean) => {
    setRememberState(on);
    persistRemember(on);
    if (on) saveDraft(draft);
  };

  const onReset = () => {
    clearDraft();
    setDraft(emptyDraft());
    setPhase("form");
    setSelectedId(null);
    setDismissedIds([]);
  };

  const onDismiss = (id: string) => {
    setDismissedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  if (!hydrated) {
    return <p className="text-muted">{COPY.loading}</p>;
  }

  return (
    <div>
      {phase === "form" ? (
        <QuestionForm
          draft={draft}
          onChange={setDraft}
          remember={remember}
          onRemember={onRemember}
          onSubmit={() => {
            setDismissedIds([]);
            setSelectedId(null);
            setPhase("result");
          }}
        />
      ) : (
        <ResultView
          draft={draft}
          onChange={setDraft}
          resolved={evaluation.resolved}
          assumptions={evaluation.assumptions}
          budgetEmpty={evaluation.budgetEmpty}
          results={visible}
          selectedId={activeId}
          onSelect={setSelectedId}
          onDismiss={onDismiss}
          onEdit={() => setPhase("form")}
          onReset={onReset}
        />
      )}
    </div>
  );
}
