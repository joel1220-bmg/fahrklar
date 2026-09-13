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
| 3 | Welche Form soll das Auto haben? (Mehrfach: Kleinwagen / Kompakt / Limousine / SUV) | „Body“ / „Preset“ |
| 4 | Wo können Sie das Auto laden? | — |
| 5 | Kaufpreis, nicht Leasingrate | „Neupreis-Spanne“ als Legende |

Eine Wortänderung, gleicher Slot: Chip **Lange Autobahn** → **Lange Autobahnfahrten** (sonst klingt der Chip wie ein Straßenname).

Form-Chips (Labels; IDs gehören Filter): Kleinwagen · Kompakt · Limousine · SUV. Mehrere gehen. Leer = alle Formen, markiert angenommen.

> **Deliberate change, 12.09.2026 (copy-guard):** „Kompakt“ ergänzt. `compact`
> ist ein echter, ausgelieferter `BodyStyle` (`lib/engine/types.ts`,
> `BODY_CHIP` in `lib/copy.ts`, zwei Autos in `data/cars.de.json`) — die
> ursprüngliche v1-Struktur kannte nur drei Formen, der Lock war seither
> stumm falsch. Kein Drift zum Nachtragen, sondern Nachvollzug einer bereits
> gebauten Produktentscheidung (siehe `CLAUDE.md` Falle 2, Backlog #9:
> `compact` trägt noch die Silhouette von `hatch`, bis #9 eigene Maße gibt —
> das ist ein Showroom-Thema, kein Sprach-Thema).

Monat und Langstrecke/Strecke gehören **nicht** ins Intake — nur in den Autobahn-Check neben dem gewählten Auto.

Weiß ich nicht / noch unklar an jedem Slot, der unsicher sein darf. Leer = Annahme + Markierung.

> **Gefunden, nicht behoben (copy-guard-Audit, 12.09.2026):** Slot 1 (Nutzung)
> hat aktuell keinen sichtbaren „Weiß ich nicht“-Chip — `USE_CHIP` in
> `lib/copy.ts` kennt nur die vier Nutzungsarten, und `UseCase`
> (`lib/engine/types.ts`) hat kein `unknown`-Mitglied. Unsicherheit geht nur,
> indem man gar keinen Chip anklickt (dann `null`), was keine sichtbare
> Handlung ist wie bei Laden („Noch unklar“) oder Tagesstrecke
> („Weiß ich nicht“-Button). Verstößt gegen diesen Lock. Braucht einen
> `UseCase`-Wert plus UI-Chip in einem Commit (engine + advisor-ux) — siehe
> Kommentar über `USE_CHIP` in `lib/copy.ts`.

> **Gefunden, nicht behoben (copy-guard-Audit, 13.09.2026):** Slot 5 legt
> einen einzelnen Kaufpreis-Deckel fest ("Kaufpreis, nicht Leasingrate"), und
> `QuestionForm.tsx` fragt auch nur danach (ein Slider, `priceMax`). Seit
> heute Morgen bietet `ControlBar.tsx` (die Kontrollleiste im Ergebnis) für
> denselben Slot zwei Slider — "Mindestens" und "Höchstens" — und schreibt
> damit `priceMin`, wonach im Intake nie gefragt wurde. Ein Leser verlässt
> die Fragen mit einer Preisobergrenze und findet im Ergebnis unangekündigt
> eine Preisuntergrenze vor, die er nie gesetzt hat (Default: offen, wirkt
> sich also nicht aus, bis er sie anfasst) — kein Bug, aber eine stille
> Erweiterung von Slot 5, die dieser Lock nicht kennt. Braucht eine
> Produktentscheidung, keine Wortentscheidung: entweder Slot 5 hier bewusst
> auf ein Zwei-Seiten-Fenster erweitern (dann auch im Intake fragen, damit
> die Kontrollleiste nichts Neues einführt), oder die Mindestens-Seite aus
> `ControlBar.tsx` wieder entfernen, bis das Intake sie kennt. Sprachlich:
> siehe `priceFromLabel`/`priceToLabel`/`priceOpenLink` in `lib/copy.ts`
> (copy-guard-Audit, 13.09.2026) für die vorgeschlagene Beschriftung, falls
> die Erweiterung bleibt.

Morgen-Schritt (einer):
> Morgen: auf Ihrem üblichen Weg notieren, wo Sie laden könnten — Steckdose oder Wallbox zu Hause, sonst eine Säule. Das bleibt bei Ihnen, kein Upload.

Locked strings: `lib/copy.ts`

## Geändert 13.09.2026 — Slot 1 hat eine neue Achse

Vorher: Alltag · Familie · Lange Autobahnfahrten · Alles etwas.
Jetzt: **Fast nur Stadt · Stadt und Urlaubsfahrten · Regelmäßig weite Strecken.**

Grund: die alte Liste mischte zwei Achsen. Drei Optionen fragten, wie weit
gefahren wird, „Familie" fragte nach Platz. Platz wird in Slot 3 ohnehin
ausdrücklich abgefragt (Kleinwagen / Kompakt / Limousine / SUV), also hat der
Slot dort nichts verloren. Übrig bleibt eine einzige Achse: wie viel
Langstrecke. Genau die, um die sich das Produkt dreht.

Mit „Familie" entfällt die sanfte SUV-Bevorzugung in der Sortierung. Das ist
Absicht: sie riet an einem Bedürfnis herum, das die Formfrage direkt erfragt.

Gespeicherte Entwürfe mit den alten Werten werden übersetzt, nicht verworfen
(`lib/schema.ts`): Alltag → Stadt, Familie und Alles etwas → Stadt und
Urlaubsfahrten, Lange Autobahnfahrten → Regelmäßig weite Strecken.
Belegt in `lib/usecase.test.ts`.

Offen: Slot 1 bietet weiterhin kein „Weiß ich nicht" (siehe Eintrag oben).
Leer lassen geht, wird als Annahme markiert.
