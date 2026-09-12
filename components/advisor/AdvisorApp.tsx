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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const rem = loadRemember();
    setRememberState(rem);
    const saved = loadDraft();
    if (saved) setDraft(saved);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (remember) saveDraft(draft);
  }, [draft, remember, hydrated]);

  const evaluation = useMemo(() => evaluateCars(draft), [draft]);

  useEffect(() => {
    if (phase !== "result") return;
    if (!selectedId || !evaluation.results.some((r) => r.car.id === selectedId)) {
      setSelectedId(evaluation.results[0]?.car.id ?? null);
    }
  }, [evaluation.results, phase, selectedId]);

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
          onSubmit={() => setPhase("result")}
        />
      ) : (
        <ResultView
          draft={draft}
          onChange={setDraft}
          resolved={evaluation.resolved}
          assumptions={evaluation.assumptions}
          results={evaluation.results}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onEdit={() => setPhase("form")}
          onReset={onReset}
        />
      )}
    </div>
  );
}
