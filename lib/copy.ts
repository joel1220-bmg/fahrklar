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
  eyebrow: "Stromstrecke",
  landingLead:
    "Ein neues E-Auto, das zu Ihrem Alltag passt. Mit ehrlicher Reichweite, nicht mit Prüfstandszahlen.",
  /**
   * Added 13.09.2026 (copy-guard audit). Every string on the landing page and
   * in the intake was checked against "does this name the reader's actual
   * fear" — none did. `landingLead` promises honesty about range in general;
   * nothing anywhere said, in plain words, "the thing you're afraid of is
   * the long trip, and that's the first thing we answer." CLAUDE.md calls
   * this out by name as the product's main claim and the reader's main
   * worry; a product that never says so out loud is easy to mistake for a
   * spec-sheet comparison tool. Not wired into app/page.tsx yet — that file
   * is design-system's (see CLAUDE.md's division of labour); meant to sit
   * directly under landingLead, before the CTA.
   */
  longDistancePromise:
    "Die größte Sorge beim Umstieg ist meist die Langstrecke. Daher beantworten wir genau das für Ihre Auswahl an Autos. Sie sehen, wie weit Sie je nach Jahreszeit wirklich kommen und wie viel Pause Sie unterwegs mehr einplanen müssen.",

  privacy: "Ihre Angaben bleiben in diesem Browser.",
  cta: "Passende Autos ansehen",
  underCta:
    "Kein Verkauf, kein Leasing-Vergleich. Orientierung zum Kauf eines Neuwagens. Wir nennen Spannen und geben keine Zusage.",
  unknownHelp:
    "Kein Problem. Wir rechnen mit einer vorsichtigen Annahme und markieren sie.",
  remember: "Angaben merken. Nur in diesem Browser, kein Konto.",
  rememberOff: "Ohne Haken bleibt nichts gespeichert.",
  notCertified: "Keine zertifizierte Beratung. Kein Angebot.",
  assumedBanner: "Kursiv bedeutet von uns angenommen, nicht von Ihnen eingegeben.",

  wltpAlways:
    "Prüfstand (WLTP) ist ein Laborwert, nicht Ihre Autobahn- oder Alltagsreichweite.",

  qUse: "Wofür brauchen Sie das Auto vor allem?",
  qUseEmpty: "Ohne Angabe rechnen wir mit Stadtverkehr und markieren das.",

  qDay: "Wie weit fahren Sie an einem normalen Tag, hin und zurück?",
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
  qBodyHint: "Mehrere Formen sind möglich. Ohne Angabe zeigen wir alle.",
  qBodyEmpty: "Ohne Angabe zeigen wir alle Formen und markieren das.",

  /** @deprecated Langstrecke is not an intake question (`intake-lock.md`). */
  qLong: "Welche Langstrecke sollen wir grob durchspielen?",
  qLongHint:
    "Größtenteils Autobahn. Ein Ladehalt nur, wenn er nötig wäre. Keine Zusage.",
  qLongEmpty: "Ohne Angabe spielen wir keine Langstrecke durch.",

  qTrip: "Wie weit soll die Autobahnfahrt ungefähr sein?",
  qTripHint: "Der Regler zählt in Kilometern. Monat und Tempo ändern die Fahrzeit.",
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
  spanNote: "Die Spanne darunter reicht von vorsichtig gerechnet bis zu guten Bedingungen.",
  /*
   * Changed 13.09.2026: the Autobahn check no longer waits for a selection, so
   * the old wording ("Wählen Sie ein Auto, dann erscheint der Autobahn-Check
   * daneben.") promised something that is already on screen. It now explains
   * whose route is being drawn, since with nothing chosen the first car stands
   * in and the reader has to know that.
   */
  pickCarFirst:
    "Gezeigt wird die Route des ersten Autos. Tippen Sie ein anderes an, um dessen Fahrt zu sehen.",
  qSpeed: "Welches Tempo auf der Autobahn?",
  /*
   * Rewritten 13.09.2026, because the engine disagreed with it.
   *
   * It used to say that most cars are best off between 110 and 130, and that
   * going much faster means arriving later. The first half is true about
   * energy and false about time; the second half is false for more than half
   * the catalogue. Measured over the 790 km route at -0.5 °C, full at the
   * start: 110 km/h is slower in total than 130 for all but the two weakest
   * cars in the list, and at 150 km/h 33 of the 61 cars still arrive no later
   * than they would at 130 - the Audi A6 e-tron 34 minutes earlier, the
   * Ioniq 6 25, the EQS 26.
   *
   * What actually splits the catalogue is charging speed, and it splits it
   * cleanly. Sorted by 10->80 %, every car under about 35 minutes gains time
   * at 150; every car over about 40 minutes loses it, and the slowest lose
   * enormously - the Leapmotor T03 is 99 minutes worse, the Dacia Spring 184.
   * So the honest sentence is not a speed limit, it is "it depends on the car,
   * and here is the thing it depends on", which is also the one question this
   * whole site exists to answer.
   *
   * If the charging model changes, re-measure before touching this text.
   */
  qSpeedHint:
    "Bei 100 km/h verbraucht das Auto am wenigsten Strom. Ob Sie schneller auch früher ankommen, hängt davon ab, wie schnell es nachlädt. Autos, die schnell laden, sind auch bei 150 km/h meist früher da. Autos, die langsam laden, verlieren die gewonnene Zeit an der Säule wieder.",
  qStart: "Wie voll ist das Auto am Start?",
  qStartHint: "Voll ist der übliche Start. Mit weniger Ladung kommt der erste Stopp früher.",
  tableWhen: "Gilt für diesen Monat und diesen Start, nicht für jedes Wetter.",
  chargeWindow: "Unterwegs von etwa 10 auf 80 Prozent, nicht die Werbe-Ladegeschwindigkeit.",
  precondAssumed: "Wir rechnen damit, dass das Auto an der Säule schon warm ist. Sonst dauert der Stopp im Winter oft länger.",

  qMonth: "Für welchen Monat rechnen wir Reichweite und Ladestopps?",
  qMonthHint:
    "Im Winter ist die Reichweite je nach Modell kürzer und die Ladestopps dauern länger.",
  qMonthEmpty: "Ohne Angabe nehmen wir den aktuellen Monat und markieren das.",

  qCharge: "Wo können Sie das Auto laden?",
  qChargeEmpty: "Ohne Angabe rechnen wir vorsichtig mit öffentlichem Laden und markieren das.",
  qChargeHomeHint:
    "Zu Hause laden macht den Alltag ruhiger. Wenn das nicht geht, rechnen wir grob mit öffentlichen Säulen.",

  qPrice: "Was darf der Neuwagen ungefähr kosten? Kaufpreis, nicht Leasingrate.",
  qPriceHint:
    "Listenpreis grob. Leasingraten blenden wir absichtlich aus, denn sie verstecken oft den Preis.",
  qPriceEmpty: "Ohne Angabe zeigen wir eine grobe Preisspanne und markieren teure Ausreißer.",
  /**
   * Added 13.09.2026 (copy-guard audit). `components/advisor/QuestionForm.tsx`
   * hardcodes "Budget offen lassen" (intake, one-sided ceiling slider) and
   * `components/advisor/ControlBar.tsx` hardcodes the shorter "offen lassen"
   * for the same action on its own two-sided min/max sliders (new this
   * morning, un-reviewed). Same action, two different labels a reader could
   * read as two different things on the way from intake to result. One
   * string for both; components are outside this file's ownership, so this
   * is a proposal for whoever wires it in, not yet referenced anywhere.
   */
  priceOpenLink: "Budget offen lassen",
  /**
   * Added 13.09.2026 (copy-guard audit), for ControlBar.tsx's two-sided
   * budget control (new this morning). "Mindestens" / "Höchstens" are
   * correct German but a more formal register than the rest of the product
   * needs, and they don't match the words the control already shows once
   * both sliders are set (`priceWindowLabel` in lib/engine/evaluate.ts prints
   * "ab 30.000 €" / "bis 45.000 €"). "Ab" / "Bis" say the same thing in the
   * same words the reader sees a moment later in the summary line — one
   * vocabulary instead of two for one control. Not wired in; ControlBar.tsx
   * is outside this file's ownership.
   */
  priceFromLabel: "Ab",
  priceToLabel: "Bis",

  morningStep:
    "Notieren Sie morgen auf Ihrem üblichen Weg, wo Sie laden könnten. Steckdose oder Wallbox zu Hause, sonst eine Säule. Das bleibt bei Ihnen, kein Upload.",

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
  priceOutlier: "Teurer Ausreißer. Sie haben kein Budget gesetzt.",
  /**
   * Added 13.09.2026 (copy-guard audit). Result cards now show
   * `{kWh-Zahl} Batterie` (ResultView.tsx, landed this morning, un-reviewed)
   * — a bare spec-sheet figure. This is the exact failure CLAUDE.md names by
   * example: "77 kWh means nothing to a beginner." The card's own comment
   * claims the number is placed right under the Autobahn range so the range
   * gives it meaning — in the actual markup a "X Sitze" line sits between
   * them, and proximity alone was never going to do the explaining anyway:
   * nothing in words ties battery size to what it buys. This string is
   * meant to be appended after the figure, turning "48,0 kWh Batterie" into
   * "48,0 kWh Batterie. Daraus ergibt sich die Reichweite oben.", naming the
   * relationship instead of relying on layout to imply it. Not wired in;
   * ResultView.tsx is outside this file's ownership. Independently, moving
   * the battery line to sit directly after the range (before "Sitze") would
   * make "oben" literally true rather than approximately true — flagged to
   * whoever owns that component.
   */
  /*
   * Added 13.09.2026. The Autobahn figure alone answers the long-distance
   * worry but says nothing about the drive this reader does every day, where
   * the same car goes noticeably further. Both spans together are the honest
   * picture; either alone is a half-truth.
   */
  /*
   * Added 13.09.2026. The table used to show dcPeakKw under the heading
   * "DC-Ladeleistung", which ladekurve-lock.md explicitly forbids as a time
   * basis: a flat curve with a lower peak can finish sooner than a peaky one
   * with a higher peak. The reader compares by whatever number is put in front
   * of them, so the number in front of them is now the time.
   */
  /*
   * Added 13.09.2026. Four paragraphs of small print sat open under the
   * comparison table and read as a wall. They are not droppable - each one
   * names an uncertainty the product is built on - so they moved behind one
   * line instead. The claim stays, the noise goes.
   */
  methodSummary: "Wie wir rechnen",
  charge1080Label: "Laden von 10 auf 80 Prozent",
  peakLabel: "Spitzenleistung",
  peakHint:
    "Die Spitzenleistung steht nur zum Vergleich da. Sie sagt wenig darüber, wie lange Sie wirklich an der Säule stehen: manche Autos halten eine niedrigere Leistung lange durch und sind schneller fertig als Autos mit hoher Spitze.",
  cityRangeLabel: "In der Stadt",
  highwayRangeLabel: "Autobahn-Reichweite",
  cityRangeHint:
    "In der Stadt reicht dieselbe Batterie weiter als auf der Autobahn, oft auch weiter als der Prüfstandswert. Das liegt nicht an schöngerechneten Zahlen, sondern daran, dass der Prüfstand Autobahn mitmisst, und genau dort verbraucht ein E-Auto am meisten. Langsam fahren kostet wenig Luft, und beim Bremsen fließt Strom zurück.",
  /*
   * "nutzbar" is not pedantry. Manufacturers advertise the gross pack while
   * only part of it is available to drive on, and four cars in this catalogue
   * carried the gross figure in their own model name while the card showed the
   * net one. Saying which of the two this is, every time, is what stops the
   * reader thinking two different numbers describe two different cars.
   *
   * The second sentence, "Daraus ergeben sich die beiden Reichweiten oben",
   * was dropped 13.09.2026. It explained the arithmetic of the card to a
   * reader who had not asked, cost three lines on each of four cards, and said
   * the same thing four times on one screen.
   */
  batteryHint: "nutzbare Batterie",
  batteryLabel: "Nutzbare Batterie",
  batteryTableHint:
    "Nutzbar heißt der Teil der Batterie, mit dem Sie wirklich fahren. Hersteller nennen oft die größere Bruttozahl.",

  // --- Leerzustände -------------------------------------------------------
  // Simplified 13.09.2026 (copy-guard audit): "in der engeren Auswahl" is
  // report-register filler a beginner has to parse before reaching the
  // actual news (no car found). "Kein passendes ... Auto" says the same
  // true thing in fewer, plainer words. Still not wired into
  // ResultView.tsx, which now has *two* independent hardcoded stand-ins
  // for this string, not one: line ~675 ("Mit diesen Angaben finden wir
  // gerade kein Auto.", no help text at all) for an empty catalogue, and
  // the separate budgetEmptyNotice case below for an empty two-sided price
  // window. Whoever owns ResultView.tsx should read both from here instead.
  emptyCatalog: "Mit diesen Angaben finden wir gerade kein passendes E-Auto.",
  // "Weiß ich nicht" only names an actual option on the Form question
  // (MultiChipGroup's unknown toggle). Kaufpreis has no chip of that name —
  // its unknown affordance is the "offen lassen" link — so this text must
  // not promise a "Weiß ich nicht" that a reader loosening the price won't
  // find. Reworded 12.09.2026 (copy-guard audit) to cover both truthfully.
  emptyCatalogHelp:
    "Lockern Sie Kaufpreis oder Form, oder lassen Sie eine Antwort offen. Dann zeigen wir eine vorsichtige, weitere Auswahl und markieren sie.",
  /**
   * Added 13.09.2026 (copy-guard audit), replacing a hardcoded string found
   * in ResultView.tsx (landed this morning, un-reviewed):
   *
   *   "In dieser Preisspanne finden wir gerade kein Auto. Wir zeigen Ihnen
   *   die nächstgelegenen — sie liegen außerhalb Ihrer Spanne."
   *
   * Two problems. First, "nächstgelegen" means nearest *in location* to a
   * German reader — used here for "closest in price" it borrows a spatial
   * word for a different axis, which a beginner has no reason to resolve
   * correctly on first read. Second, the same idea is named three ways in
   * three strings on this screen: "Preisspanne" here, "Spanne" one sentence
   * later, "Budget" in priceOutlier above and in the intake's "Budget offen
   * lassen". One word for the reader's own price limit, used everywhere:
   * "Budget" — it already won two of the three spots. Not wired in;
   * ResultView.tsx is outside this file's ownership.
   */
  budgetEmptyNotice:
    "In Ihrem Budget finden wir gerade kein Auto. Die folgenden liegen preislich am nächsten, aber außerhalb Ihres Budgets.",
} as const;

/** Landing tiles. Title and body, in the order they stand on the page. */
export const LANDING_TILES = [
  {
    title: "Alltag zuerst.",
    body: "Wenige Fragen zu Weg, Laden und Platz. „Weiß ich nicht“ ist immer erlaubt.",
  },
  {
    title: "Reichweite als Spanne.",
    body: "Wir rechnen mit Autobahn, Tempo und Kälte, nicht mit dem Prüfstand. Deshalb eine Spanne, kein Punktwert.",
  },
  {
    title: "Kaufpreis grob.",
    body: "Listenpreis als Orientierung. Keine Leasingrate, die den Preis versteckt.",
  },
] as const;

/* Changed 13.09.2026: one axis, how far the car has to go. "Familie" is gone;
   it asked about space, which the body-shape question already asks outright. */
export const USE_CHIP = {
  city: "Fast nur Stadt",
  cityTrips: "Stadt und Urlaubsfahrten",
  longDistance: "Regelmäßig weite Strecken",
} as const;

export const BODY_CHIP = {
  hatch: "Kleinwagen",
  compact: "Kompakt",
  kombi: "Kombi",
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
