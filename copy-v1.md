# Fahrklar Copy v1 — lockbar

Stand: 12.09.2026. Sie-Form. Kein Verkauf, kein Leasing. Zahlen kommen nie aus einem LLM.

Ton wie Haus-Coach: kurz, konkret, Unsicherheit sichtbar. Jargon nur mit Klappe daneben.

> **Status (copy-guard-Audit, 12.09.2026):** `intake-lock.md`, gleiches Datum,
> ist die neuere, engere Struktur ("energiefluss") und geht bei Widerspruch
> vor. Von der Struktur hier sind überholt: die PLZ-Frage, Tagesstrecke als
> Chips (jetzt km-Feld), Budget als Chips (jetzt Slider), und die
> Priorität-Frage (Abschnitt 8) — alle vier stehen nicht mehr im Intake. Ton,
> WLTP-Übersetzungspflicht, Zahlenformat und "Weiß ich nicht überall" gelten
> unverändert. Der Nutzung-Frage (Abschnitt 2) `unknown`-Chip unten ist
> weiterhin richtig — genau der ist der Implementierung verloren gegangen;
> siehe `intake-lock.md` und den Kommentar über `USE_CHIP` in `lib/copy.ts`.

## Regeln (nicht in der UI zeigen)

- WLTP nie als Alltagsreichweite. Immer übersetzen: „Prüfstand (WLTP) … — Laborwert, nicht Alltag.“
- Alltagsspanne ist die Heldenzahl. Quelle: Reichweite-Bot (Autobahn 120–130 km/h, Temperatur, Heizung vs. Wärmepumpe im Auto, Nutzbatterie).
- „Weiß ich nicht“ ist immer eine gültige Antwort. Dann vorsichtige Annahme + Markierung.
- Kaufpreis, keine Leasingrate. Keine „ab €249/Monat“.
- Keine Herstellerfotos/Logos nachbauen (Showroom: stilisierte Silhouetten).
- Orientierung, keine Zusage. Keine zertifizierte Beratung.

---

## Landing `/`

**Eyebrow:** Fahrklar

**landingLead:** Ein neues E-Auto, das zu Ihrem Alltag passt — mit ehrlicher Reichweite, nicht mit Prüfstandszahlen.

**privacy:** Ihre Angaben bleiben in diesem Browser.

**cta:** Passende Autos ansehen

**underCta:** Kein Verkauf, kein Leasing-Vergleich. Orientierung zum Kauf eines Neuwagens — Spannen, keine Zusage.

**landingTileUse / Body:** Alltag zuerst. · Wenige Fragen zu Weg, Laden und Platz. „Weiß ich nicht“ ist immer erlaubt.

**landingTileRange / Body:** Reichweite als Spanne. · Wir rechnen mit Autobahn, Tempo und Kälte — nicht mit dem Prüfstand. Deshalb eine Spanne, kein Punktwert.

**landingTilePrice / Body:** Kaufpreis grob. · Listenpreis als Orientierung. Keine Leasingrate, die den Preis versteckt.

<!-- Aligned 12.09.2026 (copy-guard) to LANDING_TILES in lib/copy.ts, the
     implemented and current version: quotes added around "Weiß ich nicht",
     and the range tile no longer re-paraphrases WLTP a third way (the one
     WLTP-Satz above already covers it; a second, different WLTP wording next
     to it undercuts "überall gleich"). app/page.tsx still hardcodes its own
     TILES array carrying the old wording below the quote fix and never
     imports LANDING_TILES — that file is outside copy-guard's ownership; see
     the copy-guard audit report. -->

<details>
<summary>Historisch (vor 12.09.2026, zum Vergleich)</summary>

- landingTileUse / Body: Alltag zuerst. · Wenige Fragen zu Weg, Laden und Platz. Weiß ich nicht ist immer erlaubt.
- landingTileRange / Body: Reichweite als Spanne. · Prüfstand (WLTP) übersetzen wir. Im Alltag, auf der Autobahn und im Winter ist es oft weniger.
- landingTilePrice / Body: Kaufpreis grob. · Listenpreis als Spanne. Keine Leasingrate, die den Preis versteckt.

</details>

---

## Fragen `/berater`

Reihenfolge. Nur aufklappen, was nötig ist. Ein klarer nächster Schritt.

### 1 · PLZ (optional)

**qPlz:** In welcher Postleitzahl fahren Sie vor allem?

**plzHint:** Ohne PLZ bleibt die Winter-Reichweite grober.

**plzPartial:** Fünf Ziffern, sobald Sie sie kennen.

### 2 · Nutzung

**qUse:** Wofür brauchen Sie das Auto vor allem?

| value | chip |
| --- | --- |
| commute | Alltag und Pendeln |
| family | Familie und Kinder |
| highway | Häufig Autobahn |
| mixed | Gemischt |
| unknown | Weiß ich nicht |

**qUseEmpty:** Ohne Angabe rechnen wir mit typischem Alltag (Pendeln plus Einkauf) und markieren das.

### 3 · Tagesstrecke

**qDay:** Wie weit fahren Sie an einem normalen Tag — hin und zurück?

| value | chip |
| --- | --- |
| under30 | Unter 30 km |
| mid | 30–80 km |
| over80 | Über 80 km |
| varies | Wechselt stark |
| unknown | Weiß ich nicht |

**qDayHelp:** Gemeint sind die meisten Tage, nicht der Urlaub.

**qDayEmpty:** Ohne Angabe nehmen wir 30–80 km an und markieren das.

### 4 · Lange Strecke

**qLong:** Wie oft fahren Sie weiter als 300 km am Stück?

| value | chip |
| --- | --- |
| rare | Selten oder nie |
| few | Ein paar Mal im Jahr |
| monthly | Monatlich oder öfter |
| unknown | Weiß ich nicht |

**qLongHelp:** Daraus folgt, ob Schnellladen auf der Autobahn für Sie zählt — nicht, welches Auto „das meiste“ kann.

### 5 · Laden

**qCharge:** Wo können Sie das Auto laden?

| value | chip |
| --- | --- |
| home | Zu Hause |
| work | Bei der Arbeit |
| public | Nur öffentlich |
| unknown | Noch unklar |

**qChargeHomeHint:** Zu Hause laden macht den Alltag ruhiger. Fehlt das, rechnen wir grob mit öffentlichen Säulen — Zeit und Kosten als Spanne.

**qChargePublicHint:** Dann zählt, wie oft Sie unterwegs nachladen müssten. Das ist eine grobe Orientierung, keine Zusage.

**qChargeUnknown:** Kein Problem — wir rechnen vorsichtig mit öffentlichem Laden und markieren das.

#### 5b · nur wenn home

**qHomeHow:** Wie laden Sie zu Hause?

| value | chip |
| --- | --- |
| wallbox | Wallbox ist da |
| planned | Steckdose, Wallbox geplant |
| socket | Nur Steckdose |
| unknown | Weiß ich nicht |

**qHomeHowHint:** Eine normale Steckdose lädt langsam (oft über Nacht nur wenig). Eine Wallbox (typisch 11 kW) schafft den Alltag meist über Nacht. kW = wie schnell der Strom fließt.

### 6 · Sitze und Platz

**qSeats:** Wie viele Sitze brauchen Sie regelmäßig?

| value | chip |
| --- | --- |
| 2 | 2 |
| 4 | 4 |
| 5 | 5 |
| 7 | 7 |
| unknown | Weiß ich nicht |

**qCargo:** Brauchen Sie regelmäßig viel Laderaum?

| value | chip |
| --- | --- |
| yes | Ja |
| no | Eher nicht |
| unknown | Weiß ich nicht |

**qSeatsEmpty:** Ohne Angabe zeigen wir 5 Sitze und markieren das.

### 7 · Budget (Kauf)

**qBudget:** Was darf der Neuwagen ungefähr kosten — Kaufpreis, nicht Leasingrate?

| value | chip |
| --- | --- |
| to35 | Bis 35.000 € |
| to45 | 35–45.000 € |
| to60 | 45–60.000 € |
| over | Darüber |
| unknown | Weiß ich nicht |

**qBudgetHelp:** Listenpreis grob, oft ohne individuelle Rabatte. Leasingraten blenden wir absichtlich aus — die verstecken oft den Preis.

**qBudgetEmpty:** Ohne Budget zeigen wir eine grobe Preisspanne und markieren teure Ausreißer.

### 8 · Priorität

**qPriority:** Was ist Ihnen am wichtigsten?

| value | chip |
| --- | --- |
| range | Alltagsreichweite |
| space | Platz |
| price | Preis |
| dc | Schnellladen auf der Autobahn |
| unknown | Weiß ich nicht noch |

**unknownHelp:** Kein Problem — wir rechnen mit einer vorsichtigen Annahme und markieren sie.

**remember:** Angaben merken — nur in diesem Browser, kein Konto.

**rememberOff:** Ohne Haken bleibt nichts gespeichert.

**submit:** Passende Autos ansehen

**submitDisabledHint:** Zwei Angaben reichen zum Start: Nutzung und Laden. Den Rest dürfen Sie offen lassen.

---

## Ergebnis-Kopf

**resultEyebrow:** Erste Auswahl

**resultLeadPattern:** Für Ihren Alltag{where} — {use}{charge}. {n} Autos in der engeren Auswahl. Orientierung, keine Zusage.

Beispiele:
- Für Ihren Alltag in 80xxx — Pendeln, Laden zu Hause. 4 Autos in der engeren Auswahl. Orientierung, keine Zusage.
- Für Ihren Alltag — Nutzung angenommen (typischer Alltag), Laden noch unklar. 6 Autos in einer weiteren Auswahl. Orientierung, keine Zusage.

**wltpAlways:** Prüfstand (WLTP) ist ein Laborwert — nicht Ihre Autobahn- oder Alltagsreichweite.

<!-- Aligned 12.09.2026 (copy-guard) to the WLTP-Satz in intake-lock.md, which
     is "überall gleich" — this line had drifted ("unter genormten
     Bedingungen" added, "Autobahn- oder" dropped) from both the lock and the
     implementation (lib/copy.ts COPY.wltpAlways), which already used the
     lock's wording correctly. -->

**rangeHeroLabel:** Alltag grob

**rangeWltpLabel:** Prüfstand (WLTP)

**rangeHeroHint:** Spanne für Mischverkehr. Autobahn bei 120–130 km/h und Kälte liegen oft am unteren Rand.

**winterNote:** Im Winter (Heizung an, oft unter 5 °C) schrumpft die Reichweite häufig um etwa 20–40 %. Eine Wärmepumpe im Auto hilft, ist aber keine Zusage.

**highwayNote:** Auf der Autobahn bei 120–130 km/h brauchen die meisten E-Autos spürbar mehr Strom als im Stadtverkehr.

**notCertified:** Keine zertifizierte Beratung. Kein Angebot.

**assumedBanner:** Grau markiert = von uns angenommen, nicht von Ihnen eingegeben.

**editQuestions:** Angaben ändern

**reset:** Entwurf löschen

---

## Showroom-Karte (eine Karte, ein nächster Schritt)

**cardFitPattern:** Passt zu {reason}.

Gründe, eine wählen — nicht stapeln:
- Ihrem Pendeln unter 80 km und Laden zu Hause
- 5 Sitzen und regelmäßigem Laderaum
- häufigen Autobahnfahrten (Schnellladen zählt)
- dem genannten Kaufpreis

**cardRange:** Alltag grob {low}–{high} km

**cardWltpFoot:** Prüfstand (WLTP) {wltp} km — Laborwert, nicht Alltag.

**cardPrice:** Kaufpreis grob {low}–{high} €

**cardPriceFoot:** Listenpreis-Spanne, oft ohne Rabatt. Kein Leasing.

**cardCta:** Details ansehen

**cardWhyMore:** Warum die Spanne?

**cardWhyMoreBody:** Batterie nutzbar ungleich Nenngröße. Tempo, Heizung und Außentemperatur ändern den Verbrauch. Deshalb eine Spanne, kein Punktwert.

---

## Auto-Detail

**detailRangeTitle:** Reichweite — ehrlich

| Zeile | Label | Hilfe |
| --- | --- | --- |
| hero | Alltag grob | Mischverkehr, milde Temperatur |
| highway | Autobahn 120–130 km/h | oft deutlich weniger als der Prüfstand |
| winter | Kalt, Heizung an | grob 20–40 % unter dem milden Alltag |
| wltp | Prüfstand (WLTP) | Laborwert. Nicht als Alltagsreichweite lesen. |

**usableBattery:** Nutzbatterie ca. {n} kWh — das ist der Teil, den Sie wirklich fahren, nicht die Zahl auf dem Datenblatt.

**dcCharge:** Schnellladen grob: von etwa 10 auf 80 % in {low}–{high} Minuten (unter guten Bedingungen, Säule und Auto müssen zusammenpassen).

**dcChargeFoot:** Im Winter und bei voller Säule oft langsamer. Keine Zusage.

**homeCharge:** Zu Hause an 11 kW (typische Wallbox): leer zu voll grob über Nacht. An einer normalen Steckdose deutlich länger.

**seatsCargo:** {seats} Sitze · Laderaum {cargo}

**nextStepHome:** Morgen: klären, ob eine Wallbox möglich ist (Stellplatz, Zähler, Hauseigentum oder Vermieter).

**nextStepPublic:** Morgen: eine öffentliche Säule auf Ihrem normalen Weg anschauen — Stecker-Typ und ob sie frei ist, wenn Sie ankommen.

**nextStepLong:** Morgen: eine Ihrer 300-km-Strecken grob nachzeichnen. Wir zeigen, ob ein Ladehalt nötig wäre — nur wenn nötig.

**print:** Drucken / PDF

---

## Leer- und Fehlerzustände

**emptyCatalog:** Mit diesen Angaben finden wir gerade kein neues E-Auto in der engeren Auswahl.

**emptyCatalogHelp:** Lockern Sie Budget oder Sitze — oder wählen Sie Weiß ich nicht. Dann zeigen wir eine vorsichtige, weitere Auswahl und markieren sie.

**emptyCatalogCta:** Angaben lockern

**emptyAssumed:** Noch wenig Konkretes. Die Auswahl steht auf Annahmen.

**loading:** Laden …

**noPlz:** Ohne PLZ bleibt die Winter-Spanne deutschlandweit grob.

**offlineCalc:** Die Rechnung läuft in Ihrem Browser. Kein Konto, kein Tracker.

**errorGeneric:** Das hat gerade nicht geklappt. Ihre Angaben sind noch da. Bitte noch einmal versuchen.

**filterZero:** Diese Kombination filtert alles weg. Ein Chip zurücknehmen reicht oft.

---

## Mikro-Wörterbuch (UI-Klappen, nie nackt)

| Begriff | Immer so erklären |
| --- | --- |
| WLTP | Prüfstand / Laborwert unter genormten Bedingungen, nicht Alltag |
| kWh | wie viel Energie die Batterie hält, vergleichbar: Größe des Tanks |
| kW | wie schnell geladen wird (Wallbox oft 11 kW) |
| Nutzbatterie | der Teil, den Sie wirklich fahren — kleiner als die Werbezahl |
| DC / Schnellladen | Laden an der Autobahn-Säule, Gleichstrom, Minuten statt Stunden |
| AC | Laden zu Hause oder an der Laterne, Wechselstrom, oft über Nacht |
| Wärmepumpe (Auto) | heizt sparsamer als eine normale Heizspirale, hilft im Winter |

Nie ungeklärt: BEV, SoC, C-Rate, Nettokapazität, CCS (oder: „der übliche Schnelllade-Stecker in DE“).

---

## Was diese Copy bewusst nicht tut

- Keine „Top-Deals“, Sterne, Händler-CTA, Finanzierungsrechner.
- Keine Leasingrate als Einstieg.
- Kein „bis zu 600 km Reichweite“ ohne WLTP-Übersetzung.
- Kein Vergleich „vs. Verbrenner spart X €“, solange Reichweite das nicht gespeist hat.
