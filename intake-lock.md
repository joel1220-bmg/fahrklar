# Fahrklar Intake-Lock v1 (Sprache)

Struktur von energiefluss, 12.09.2026. Nicht umbauen. Nur Alltagssprache.

Sechs Fragen, ein Morgen-Schritt. Sie-Form. Kein Verkauf.

WLTP-Satz (überall gleich):
> Prüfstand (WLTP) ist ein Laborwert — nicht Ihre Autobahn- oder Alltagsreichweite.

## Sprache, die ich gehalten habe

| Slot | UI-Wort | Nicht in der UI |
| --- | --- | --- |
| 1 | Alltag / Familie / Lange Autobahnfahrten / Alles etwas | — |
| 2 | normaler Tag, hin und zurück, km-Feld | „Normaler Tag km“ als Legende |
| 3 | Welche Langstrecke … durchspielen? | „Preset“ |
| 4 | Für welchen Monat soll die Reichweite gelten? | — |
| 5 | Wo können Sie das Auto laden? | — |
| 6 | Kaufpreis, nicht Leasingrate | „Neupreis-Spanne“ als Legende |

Eine Wortänderung, gleicher Slot: Chip **Lange Autobahn** → **Lange Autobahnfahrten** (sonst klingt der Chip wie ein Straßenname).

Langstrecke-Chips (Labels; IDs gehören Reichweite): Selten oder nie · Hamburg – München · Berlin – Köln · Stuttgart – Berlin · Weiß ich nicht.

Monat: native Auswahl Januar–Dezember, Default = aktueller Monat. Keine 12 Chips.

Weiß ich nicht / noch unklar an jedem Slot, der unsicher sein darf. Leer = Annahme + Markierung.

Morgen-Schritt (einer):
> Morgen: auf Ihrem üblichen Weg notieren, wo Sie laden könnten — Steckdose oder Wallbox zu Hause, sonst eine Säule. Das bleibt bei Ihnen, kein Upload.

Locked strings: `lib/copy.ts`
