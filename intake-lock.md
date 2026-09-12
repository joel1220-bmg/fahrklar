# Fahrklar Intake-Lock v1 (Sprache)

Struktur von energiefluss, 12.09.2026. Nicht umbauen. Nur Alltagssprache.

Fünf Fragen im Intake, Autobahn-Check erst nach Autowahl. Sie-Form. Kein Verkauf.

WLTP-Satz (überall gleich):
> Prüfstand (WLTP) ist ein Laborwert — nicht Ihre Autobahn- oder Alltagsreichweite.

## Sprache, die ich gehalten habe

| Slot | UI-Wort | Nicht in der UI |
| --- | --- | --- |
| 1 | Alltag / Familie / Lange Autobahnfahrten / Alles etwas | — |
| 2 | normaler Tag, hin und zurück, km-Feld | „Normaler Tag km“ als Legende |
| 3 | Welche Form soll das Auto haben? (Mehrfach: Kleinwagen / Limousine / SUV) | „Body“ / „Preset“ |
| 4 | Wo können Sie das Auto laden? | — |
| 5 | Kaufpreis, nicht Leasingrate | „Neupreis-Spanne“ als Legende |

Eine Wortänderung, gleicher Slot: Chip **Lange Autobahn** → **Lange Autobahnfahrten** (sonst klingt der Chip wie ein Straßenname).

Form-Chips (Labels; IDs gehören Filter): Kleinwagen · Limousine · SUV. Mehrere gehen. Leer = alle Formen, markiert angenommen.

Monat und Langstrecke/Strecke gehören **nicht** ins Intake — nur in den Autobahn-Check neben dem gewählten Auto.

Weiß ich nicht / noch unklar an jedem Slot, der unsicher sein darf. Leer = Annahme + Markierung.

Morgen-Schritt (einer):
> Morgen: auf Ihrem üblichen Weg notieren, wo Sie laden könnten — Steckdose oder Wallbox zu Hause, sonst eine Säule. Das bleibt bei Ihnen, kein Upload.

Locked strings: `lib/copy.ts`
