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

  const visible = useMemo(() => {
    const dismissed = new Set(dismissedIds);
    return evaluation.results.filter((r) => !dismissed.has(r.car.id)).slice(0, 3);
  }, [evaluation.results, dismissedIds]);

  // If selected car scrolls out of the visible slice (e.g. filter change), clear selection
  useEffect(() => {
    if (phase !== "result") return;
    if (selectedId && !visible.some((r) => r.car.id === selectedId)) {
      setSelectedId(null);
    }
  }, [visible, phase, selectedId]);

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
          results={visible}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onDismiss={onDismiss}
          onEdit={() => setPhase("form")}
          onReset={onReset}
        />
      )}
    </div>
  );
}
