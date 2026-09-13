# Fahrklar — Backlog

Twenty pieces of work, each with one owner. The owner column is the agent in
`.claude/agents/` whose file set covers it. **Two agents never write the same
file**; that is what keeps parallel work from eating itself.

Status: `offen` · `läuft` · `fertig` · `blockiert`

## Welle 1 — Fundament (parallel, disjunkt)

| # | Aufgabe | Besitzer | Status |
|---|---|---|---|
| 1 | ControlBar in ResultView + AdvisorApp einhängen; alte Lesekacheln entfernen | advisor-ux | **fertig** |
| 2 | Erst-Audit: Kontrast, Tastatur, 390 px, Datenehrlichkeit | quality | **fertig** (`docs/audit-2026-09-12.md`) |
| 3 | Copy gegen `intake-lock.md` und `copy-v1.md` prüfen | copy-guard | **fertig** |
| 4 | Helles Studio-Licht im Showroom wiederherstellen (lag im Scratchpad) | showroom | **fertig** |

## Welle 2 — Das Ergebnis als Daten lesbar machen

| # | Aufgabe | Besitzer | Status |
|---|---|---|---|
| 5 | Reichweiten-Spanne als Balken statt als Text | advisor-ux | offen |
| 6 | Tabellen-Umschalter nach SMARD-Vorbild („Tabelle anzeigen") | advisor-ux | **fertig** |
| 7 | Balken-, Spur- und Markierungs-Tokens für Datenvisualisierung | design-system | teilweise (`Num.tsx`) |
| 8 | Auto-Karten: Auswahl, Verwerfen und Vergleich schärfen | advisor-ux | offen |

## Welle 3 — Substanz

| # | Aufgabe | Besitzer | Status |
|---|---|---|---|
| 9 | `compact` bekommt eigene Maße und einen Generator-Eintrag | showroom | **fertig**, dazu `kombi` |
| 10 | Reichweiten-Modell prüfen: Tempo, Temperatur, Verbrauch | engine | **fertig** (Luftdichte ergänzt) |
| 11 | Ladekurve gegen `ladekurve-lock.md` prüfen | engine | **fertig** (Stopps nach Bedarf) |
| 12 | Seed-Zahlen in `data/**` belegen oder als ungeprüft markieren | engine | offen — `AVG_KW_10_80` markiert |
| 13 | Testlücken schließen (Grenzfälle, leere Auswahl, Extremwerte) | engine | **fertig** (145 Tests) |

## Welle 4 — Schliff

| # | Aufgabe | Besitzer | Status |
|---|---|---|---|
| 14 | Mobil 390 px durchgehend, alle Routen | design-system | offen |
| 15 | Fokus-Reihenfolge und sichtbarer Fokus überall | design-system | offen |
| 16 | Druckansicht: Ergebnis als sauberes PDF | design-system | offen |
| 17 | Leerzustände und Fehlerfälle bekommen echte Texte | copy-guard | offen |

## Welle 5 — Absicherung

| # | Aufgabe | Besitzer | Status |
|---|---|---|---|
| 18 | `verify.ps1`: tsc + Tests + Lint + Build | — (Integration) | **fertig** |
| 19 | Screenshot-Regression für alle Routen, 390 px und 1280 px | quality | offen |
| 20 | `CLAUDE.md` fürs Projekt: Grenzen, Schleife, Fallen | — (Integration) | **fertig** |

---

## Regeln für die Zusammenarbeit

1. **Ein Besitzer pro Datei.** Braucht eine Aufgabe fremde Dateien, wird das
   gemeldet, nicht gemacht.
2. **Jede Welle endet mit einem grünen Baum.** `npx tsc --noEmit` und
   `npx vitest run`, bevor etwas als fertig gilt.
3. **Committen, bevor die nächste Welle startet.** Uncommittete Arbeit von
   mehreren Prozessen ist genau die Art, wie am 12.09. Arbeit verloren ging.
4. **Ansehen schlägt Nachdenken.** Alles Sichtbare wird im Browser geprüft,
   nicht am Code hergeleitet.

## Was schon passiert ist

- `2fdc28e`, `91c51ab` — 48 Dateien uncommitteter Arbeit gesichert
- `1d9e26b` — Build repariert: offener Ternär in `ResultView`, fehlende
  `compact`-Karosserie. `/berater` lieferte vorher HTTP 500.
- `581a6ed` — Helles Theme mit SMARD-Blau
- `f2afc17` — `ControlBar.tsx` geschrieben
- `7edbc45` — `verify.ps1` und Projekt-`CLAUDE.md`
- `8b11506` — Welle 1, soweit sie vor dem Sitzungslimit kam. Sechs Agenten
  starben am Limit; vier hatten brauchbare Teilarbeit abgelegt.
- `9155273` — Winter-Ladeplanung. Aus einer Nutzerkritik an einer 840-km-
  Dezemberfahrt: Ladestopps luden pauschal 70 % des Akkus statt nach Bedarf
  (44 Minuten 12 km vor dem Ziel), und die Kaltluftdichte fehlte im Verbrauch
  ganz. 65 Tests.

## Seit dem 13.09. dazugekommen

| Aufgabe | Status |
|---|---|
| Preis als Spanne mit zwei Griffen, Grenzen aus dem Katalog | **fertig** |
| Karosserie-Umrisse als 2D-Icons, fünf Formen inklusive Kombi | **fertig** |
| Erste Frage auf eine Achse: wie viel Langstrecke | **fertig** |
| Autobahn-Check ohne vorherige Autowahl sichtbar | **fertig** |
| Gedankenstriche und Doppelpunkte aus allen UI-Texten | **fertig** |
| Gezeichnete Strecke wächst bis zum Reglerende | **fertig** |
| Route bleibt innerhalb der Landesgrenze, mit Punkt-in-Polygon-Test | **fertig** |
| Regler, Karte und Vergleich auf einem Schirm, 663 px | **fertig** |
| Städtische Reichweite als zweite Spanne | **fertig** |
| Ladezeit 10 auf 80 Prozent statt Spitzenleistung als Vergleichswert | **fertig** |

## Was jetzt am meisten stört

1. **Handy.** Nach dem Absenden sieht man kein einziges Auto ohne zu scrollen,
   624 px Kopfbereich stehen davor. `components/ui/Disclosure.tsx` liegt fertig
   da, ist aber nicht eingehängt.
2. **Katalog gegen echte Quellen prüfen.** 18 Autos sind als ungeprüft
   markiert, und bei zweien im Altbestand war die Ladeleistung nachweislich
   falsch. Größter offener Posten, braucht Daten von außen.
3. **Farbe allein als Signal.** Angenommene Werte stehen kursiv und grau, sonst
   nichts. `components/ui/AssumedMarker.tsx` liegt fertig da, nicht eingehängt.
4. **Nutzung bietet kein Weiß-ich-nicht**, ein Verstoß gegen `intake-lock.md`.
5. **Touch-Ziele unter 44 px** in `ResultView` und `ControlBar`, dazu ein
   ungültiges `role="radio"` ohne `radiogroup` in `QuestionForm`.

## Nächster Halt

Welle 1 ist nicht abgeschlossen — das Audit (#2) kam gar nicht zum Zug, Copy
(#3) und Datenvisualisierungs-Tokens (#7) nur halb. Die laufen zuerst, bevor
Welle 2 startet.
