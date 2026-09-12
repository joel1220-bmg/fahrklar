/** Locked Fahrklar v1 intake copy. Do not paraphrase in the UI. */

/** One source for the chip that every uncertain question must offer. */
const UNKNOWN = "Weiß ich nicht";

/**
 * Known gap (copy-guard audit, 12.09.2026): `USE_CHIP` below has no
 * "unknown" entry, and `UseCase` (`lib/engine/types.ts`) has no "unknown"
 * member either — so the Nutzung question is the one place in the intake
 * with no affirmative "Weiß ich nicht". `copy-v1.md`'s original qUse table
 * had `unknown | Weiß ich nicht`; that got lost, not deliberately dropped.
 * Fixing it needs `UseCase` to gain the member (engine), `QuestionForm.tsx`
 * / `ControlBar.tsx` to render it (advisor-ux), and this file to add
 * `unknown: UNKNOWN` to `USE_CHIP` — in one commit, per CLAUDE.md's "a new
 * variant means every consumer changes together" trap. Do not add the key
 * here alone; an untyped "unknown" UseCase reaching the engine is a crash,
 * not a feature.
 */

export const COPY = {
  // --- Landing -----------------------------------------------------------
  // eyebrow, landingLead and LANDING_TILES below are not wired into
  // app/page.tsx — it hardcodes the same eyebrow ("Fahrklar"), the same
  // heading text, and its own local `TILES` array instead of importing
  // LANDING_TILES. The hardcoded TILES has drifted: its second tile still
  // carries the pre-audit WLTP paraphrase and lost the „…“ quotes around
  // "Weiß ich nicht". Found in the 12.09.2026 copy-guard audit; app/page.tsx
  // is outside this file's ownership, so left for whoever owns it to rewire.
  eyebrow: "Fahrklar",
  landingLead:
    "Ein neues E-Auto, das zu Ihrem Alltag passt — mit ehrlicher Reichweite, nicht mit Prüfstandszahlen.",

  privacy: "Ihre Angaben bleiben in diesem Browser.",
  cta: "Passende Autos ansehen",
  underCta:
    "Kein Verkauf, kein Leasing-Vergleich. Orientierung zum Kauf eines Neuwagens — Spannen, keine Zusage.",
  unknownHelp:
    "Kein Problem — wir rechnen mit einer vorsichtigen Annahme und markieren sie.",
  remember: "Angaben merken — nur in diesem Browser, kein Konto.",
  rememberOff: "Ohne Haken bleibt nichts gespeichert.",
  notCertified: "Keine zertifizierte Beratung. Kein Angebot.",
  assumedBanner: "Grau markiert = von uns angenommen, nicht von Ihnen eingegeben.",

  wltpAlways:
    "Prüfstand (WLTP) ist ein Laborwert — nicht Ihre Autobahn- oder Alltagsreichweite.",

  qUse: "Wofür brauchen Sie das Auto vor allem?",
  qUseEmpty: "Ohne Angabe rechnen wir mit Alltag und markieren das.",

  qDay: "Wie weit fahren Sie an einem normalen Tag — hin und zurück?",
  qDayHint: "Kilometer, grob reicht. „Weiß ich nicht“ ist erlaubt.",
  qDayEmpty: "Ohne Angabe nehmen wir 50 km an und markieren das.",
  qDayPlaceholder: "z. B. 50",
  /**
   * The single "Weiß ich nicht" chip label, reused wherever a question
   * offers it — despite the name, not day-specific: QuestionForm.tsx and
   * ControlBar.tsx also use it for the Form (Body) multi-chip group's
   * unknown toggle. Keep this the one constant; do not add a second
   * `unknownChip`-style duplicate (one existed here and sat unused — removed
   * in the 12.09.2026 copy-guard pass).
   */
  qDayUnknownChip: UNKNOWN,

  qBody: "Welche Form soll das Auto haben?",
  qBodyHint: "Mehrere gehen. Ohne Angabe zeigen wir alle Formen.",
  qBodyEmpty: "Ohne Angabe zeigen wir alle Formen und markieren das.",

  /** @deprecated Langstrecke is not an intake question (`intake-lock.md`). */
  qLong: "Welche Langstrecke sollen wir grob durchspielen?",
  qLongHint:
    "Größtenteils Autobahn. Ein Ladehalt nur, wenn er nötig wäre — keine Zusage.",
  qLongEmpty: "Ohne Angabe spielen wir keine Langstrecke durch.",

  qTrip: "Wie weit soll die Autobahnfahrt ungefähr sein?",
  qTripHint: "Regler in Kilometern. Monat und Tempo ändern die Zeit.",
  qTripEmpty: "Ohne Strecke bleibt die Karte leer.",

  tripDrive: "Fahrt",
  tripCharge: "Laden extra",
  tripTotal: "Gesamt",
  dismissCar: "Passt nicht",

  autobahnTitle: "Autobahn-Check",
  autobahnHint:
    "Ihre Autos nebeneinander, sortiert nach Ladestopps. Orientierung, kein Navi.",
  compareStops: "Ladestopps",
  compareTotal: "Gesamt",
  spanNote: "Spanne darunter: von vorsichtig gerechnet bis zu guten Bedingungen.",
  pickCarFirst:
    "Wählen Sie ein Auto — dann erscheint der Autobahn-Check daneben.",
  qSpeed: "Welches Tempo auf der Autobahn?",
  qStart: "Wie voll ist das Auto am Start?",
  qStartHint: "Voll ist der übliche Start. Weniger voll heißt oft ein früherer erster Stopp.",
  tableWhen: "Gilt für diesen Monat und diesen Start — nicht für jedes Wetter.",
  chargeWindow: "Unterwegs von etwa 10 auf 80 Prozent — nicht die Werbe-Ladegeschwindigkeit.",
  precondAssumed: "Wir rechnen damit, dass das Auto an der Säule schon warm ist. Sonst dauert der Stopp im Winter oft länger.",

  qMonth: "Für welchen Monat rechnen wir Reichweite und Ladestopps?",
  qMonthHint:
    "Im Winter ist die Fahrt oft kürzer und der Stopp an der Säule oft länger.",
  qMonthEmpty: "Ohne Angabe nehmen wir den aktuellen Monat und markieren das.",

  qCharge: "Wo können Sie das Auto laden?",
  qChargeEmpty: "Ohne Angabe rechnen wir vorsichtig mit öffentlichem Laden und markieren das.",
  qChargeHomeHint:
    "Zu Hause laden macht den Alltag ruhiger. Fehlt das, rechnen wir grob mit öffentlichen Säulen.",

  qPrice: "Was darf der Neuwagen ungefähr kosten — Kaufpreis, nicht Leasingrate?",
  qPriceHint:
    "Listenpreis grob. Leasingraten blenden wir absichtlich aus — die verstecken oft den Preis.",
  qPriceEmpty: "Ohne Angabe zeigen wir eine grobe Preisspanne und markieren teure Ausreißer.",

  morningStep:
    "Morgen: auf Ihrem üblichen Weg notieren, wo Sie laden könnten — Steckdose oder Wallbox zu Hause, sonst eine Säule. Das bleibt bei Ihnen, kein Upload.",

  skipCheck: "Sie dürfen das auch weglassen.",
  skipTrip: "Autobahnfahrt weglassen",
  compareTitle: "Ihre Wahl neben den Alternativen",

  submit: "Passende Autos ansehen",
  editQuestions: "Angaben ändern",
  reset: "Entwurf löschen",
  loading: "Einen Moment …",

  // --- Ergebnis-Kopf -----------------------------------------------------
  // NB: resultEyebrow and resultOrientation are not wired into ResultView.tsx
  // yet — it currently hardcodes "Erste Auswahl" and its own results-count
  // sentence inline (see copy-guard audit, 12.09.2026). Kept here as the
  // source of truth for whoever wires it up; do not let the hardcoded copy
  // in the component drift from these.
  resultEyebrow: "Erste Auswahl",
  resultOrientation: "Orientierung, keine Zusage.",
  // assumedTag / enteredTag: not currently rendered anywhere. ControlBar.tsx
  // marks an assumed value with italics + colour only (COPY.assumedBanner
  // explains the convention once, in prose) — no per-value text tag. Kept in
  // case a screen-reader-visible tag turns out to be needed; flag to the
  // quality agent's accessibility audit (backlog #2) rather than reviving
  // silently.
  assumedTag: "Angenommen",
  enteredTag: "Eingegeben",

  // --- Preis -------------------------------------------------------------
  priceFoot: "Listenpreis, oft ohne Rabatt. Kein Leasing.",
  // Not wired: ResultView.tsx:163 hardcodes "Teurer Ausreißer (Budget offen)"
  // on the car card instead of reading this. Same claim, different wording —
  // pick one and reference it (copy-guard audit, 12.09.2026).
  priceOutlier: "Teurer Ausreißer — Sie haben kein Budget gesetzt.",

  // --- Leerzustände -------------------------------------------------------
  emptyCatalog:
    "Mit diesen Angaben finden wir gerade kein neues E-Auto in der engeren Auswahl.",
  // "Weiß ich nicht" only names an actual option on the Form question
  // (MultiChipGroup's unknown toggle). Kaufpreis has no chip of that name —
  // its unknown affordance is the "offen lassen" link — so this text must
  // not promise a "Weiß ich nicht" that a reader loosening the price won't
  // find. Reworded 12.09.2026 (copy-guard audit) to cover both truthfully.
  emptyCatalogHelp:
    "Lockern Sie Kaufpreis oder Form — oder lassen Sie eine Antwort offen. Dann zeigen wir eine vorsichtige, weitere Auswahl und markieren sie.",
} as const;

/** Landing tiles. Title and body, in the order they stand on the page. */
export const LANDING_TILES = [
  {
    title: "Alltag zuerst.",
    body: "Wenige Fragen zu Weg, Laden und Platz. „Weiß ich nicht“ ist immer erlaubt.",
  },
  {
    title: "Reichweite als Spanne.",
    body: "Wir rechnen mit Autobahn, Tempo und Kälte — nicht mit dem Prüfstand. Deshalb eine Spanne, kein Punktwert.",
  },
  {
    title: "Kaufpreis grob.",
    body: "Listenpreis als Orientierung. Keine Leasingrate, die den Preis versteckt.",
  },
] as const;

export const USE_CHIP = {
  everyday: "Alltag",
  family: "Familie",
  highway: "Lange Autobahnfahrten",
  mixed: "Alles etwas",
} as const;

export const BODY_CHIP = {
  hatch: "Kleinwagen",
  compact: "Kompakt",
  sedan: "Limousine",
  crossover: "SUV",
} as const;

/**
 * @deprecated City-pair presets. `intake-lock.md`: Langstrecke belongs in the
 * Autobahn-Check next to a chosen car, never in the intake. Unused — do not
 * wire this back into a question.
 */
export const LONG_CHIP = {
  none: "Selten oder nie",
  hamMuc: "Hamburg – München",
  berCgn: "Berlin – Köln",
  strBer: "Stuttgart – Berlin",
  unknown: UNKNOWN,
} as const;

export const CHARGE_CHIP = {
  home: "Zu Hause",
  work: "Bei der Arbeit",
  public: "Nur öffentlich",
  unknown: "Noch unklar",
} as const;

/** @deprecated Budget as chips; the intake uses a slider. Unused. */
export const PRICE_CHIP = {
  to35: "Bis 35.000 €",
  to45: "35–45.000 €",
  to60: "45–60.000 €",
  over: "Darüber",
  unknown: UNKNOWN,
} as const;

export const MONTH_LABEL: Record<number, string> = {
  1: "Januar",
  2: "Februar",
  3: "März",
  4: "April",
  5: "Mai",
  6: "Juni",
  7: "Juli",
  8: "August",
  9: "September",
  10: "Oktober",
  11: "November",
  12: "Dezember",
};
