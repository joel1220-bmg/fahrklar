/** Locked Fahrklar v1 intake copy. Do not paraphrase in the UI. */

export const COPY = {
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
  qDayHint: "Kilometer, grob reicht. Weiß ich nicht ist erlaubt.",
  qDayEmpty: "Ohne Angabe nehmen wir 50 km an und markieren das.",
  qDayPlaceholder: "z. B. 50",
  qDayUnknownChip: "Weiß ich nicht",

  qBody: "Welche Form soll das Auto haben?",
  qBodyHint: "Mehrere gehen. Ohne Angabe zeigen wir alle Formen.",
  qBodyEmpty: "Ohne Angabe zeigen wir alle Formen.",

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
  autobahnHint: "Drei Autos nebeneinander, sortiert nach Stopps. Orientierung, kein Navi.",
  compareStops: "Ladestopps",
  compareTotal: "Gesamt",
  spanNote: "Spanne darunter: vorsichtig bis günstig.",
  pickCarFirst:
    "Tippen Sie ein Auto an — dann erscheint der Autobahn-Check daneben.",
  qSpeed: "Welches Tempo auf der Autobahn?",
  qStart: "Wie voll ist das Auto am Start?",
  qStartHint: "Voll ist der übliche Start. Weniger voll heißt oft ein früherer erster Stopp.",
  tableWhen: "Gilt für diesen Monat und diesen Start — nicht für jedes Wetter.",
  chargeWindow: "Unterwegs von etwa 10 auf 80 Prozent — nicht die Werbe-Ladegeschwindigkeit.",
  precondAssumed: "Wir rechnen damit, dass das Auto an der Säule schon warm ist. Sonst dauert der Stopp im Winter oft länger.",

  qMonth: "Für welchen Monat rechnen wir Reichweite und Ladestopps?",
  qMonthHint:
    "Im Winter ist die Fahrt oft kürzer und der Stopp an der Säule oft länger.",
  qMonthEmpty: "Ohne Angabe nehmen wir den aktuellen Monat.",

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
  compareTitle: "Ihre Wahl + zwei Alternativen",

  submit: "Passende Autos ansehen",
  editQuestions: "Angaben ändern",
  reset: "Entwurf löschen",
  loading: "Laden …",
} as const;

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
  crossover: "SUV oder Crossover",
} as const;

export const LONG_CHIP = {
  none: "Selten oder nie",
  hamMuc: "Hamburg – München",
  berCgn: "Berlin – Köln",
  strBer: "Stuttgart – Berlin",
  unknown: "Weiß ich nicht",
} as const;

export const CHARGE_CHIP = {
  home: "Zu Hause",
  work: "Bei der Arbeit",
  public: "Nur öffentlich",
  unknown: "Noch unklar",
} as const;

export const PRICE_CHIP = {
  to35: "Bis 35.000 €",
  to45: "35–45.000 €",
  to60: "45–60.000 €",
  over: "Darüber",
  unknown: "Weiß ich nicht",
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
