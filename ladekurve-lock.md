# Fahrklar Ladekurve-Lock v1.1 (DC-Physik)

Stand 12.09.2026 · DE · typische Neuwagen. Fachbot Ladekurve. **Kein Code.** Keine Werbe-kW als Alltagszeit. Keine Orts-Navigation.
Übergabe an Ladezeit: Formeln + Katalog-Tabelle unten. Umsetzung erst nach Jo-OK.

## Laien-Satz (eine Zeile)

Unterwegs zählt, wie schnell das Auto **von etwa 10 auf 80 Prozent** nachlädt — nicht die große Peak-Zahl auf dem Datenblatt. Die Fahrt startet oft **voll**; danach kurze Stopps im schnellen Fenster.

---

## 1. Start-SoC vs. Stop-Fenster

| Phase | SoC | Energieanteil Nutzbatterie | Leg-Länge (Autobahn-Reichweite bei 100 %) |
| --- | --- | --- | --- |
| Fahrtstart | oft **100 %** (Default; Slider erlaubt 90–100 %) | — | — |
| Ankunft am Stopp | **~10 %** (Lock: `arriveSoc = 0,10`) | — | — |
| Erste Etappe | `startSoc → arriveSoc` | `startSoc − 0,10` | `range100 × (startSoc − 0,10)` |
| Nachladen | **10 → 80 %** | **0,70** | — |
| Folge-Etappe | 80 % → 10 % | **0,70** | `range100 × 0,70` |

Mit `range100 = rangeMid / startSoc` (wenn `rangeMid` schon mit Start-SoC gerechnet wurde).

**Widerspruch zur alten Heuristik:** `rangeMid × 0,75` bei `startSoc 0,9` landet ~bei 22 % — zu hoch für „10 %-Ankunft“ und vermischt Puffer mit Physik. **Lock:** explizite SoC-Deltas, kein 0,75-Multiplikator mehr.

Stop-Energie (immer):

```
E_stop_kWh = usableKwh × 0,70
```

Nicht bis 100 % an der Säule — die letzten ~20 % kosten unverhältnismäßig viel Zeit (Taper).

---

## 2. Peak ≠ Mittel 10–80

- `peakKw` = Katalog `dcPeakKw` — **nur Referenz, nie Zeitbasis**
- `avgKw_10_80` = mittlere Leistung 10→80 % bei ~**20 °C**, warmem Akku, Säule ≥ Peak

Ableitung aus Katalog-Peak, wenn keine Messung:

| Kurvenklasse | `f_avg` (mid) | Spanne low–high | Typische Autos |
| --- | --- | --- | --- |
| `peaky` | 0,45 | 0,40–0,52 | hoher Peak, früher Abfall (oft Tesla RWD) |
| `typical` | **0,55** | 0,48–0,62 | Default ohne Messung |
| `flat` | 0,65 | 0,58–0,75 | langes Plateau / oft 800 V (Ioniq 5 u. ä.) |

```
avgKw_10_80.mid  = peakKw × f_avg
avgKw_10_80.low  = peakKw × f_avg_low
avgKw_10_80.high = peakKw × f_avg_high
```

Regel: flache Kurve mit niedrigerem Peak kann **kürzer** stehen als peakige Kurve mit höherem Peak.

### Katalog-Midwerte (~20 °C, Orientierung EVKX/ADAC, Stand 2026)

Spannen = Messunsicherheit / Varianten / Säule — keine Zusage.

| id | peakKw | Klasse | avgKw_10_80 low / mid / high | Hinweis |
| --- | --- | --- | --- | --- |
| vw-id7 | 200 | typical→flach | 110 / **125** / 145 | EVKX Tourer Pro ~122; GTX höher |
| tesla-m3 | 250* | peaky/LFP | 75 / **105** / 120 | *Katalog-Peak oft übertrieben für RWD-LFP; EV-DB ~110 Ø, EVKX LFP ~76; Peak real eher ~170–175 |
| tesla-my | 250* | peaky | 90 / **110** / 125 | ähnlich; ohne Vorkondi Winter stark |
| byd-seal | 150 | typical | 90 / **103** / 115 | ADAC Seal Design Ø ~103 kW, ~39 min |
| hyundai-ioniq5 | 235 | flat | 150 / **175** / 190 | EVKX ~175 kW (800 V) |
| vw-id3 | 165 | typical | 85 / **95** / 110 | grob Peak×0,55–0,60 |
| skoda-elroq | 175 | typical | 90 / **100** / 115 | MEB, ähnlich ID |
| kia-ev3 | 128 | typical | 70 / **80** / 95 | moderater Peak |
| bmw-ix1 | 130 | typical | 70 / **80** / 95 | |
| renault-5 | 100 | typical | 50 / **58** / 70 | |
| cupra-born | 135 | typical | 70 / **80** / 95 | |
| volvo-ex30 | 153 | typical | 75 / **90** / 105 | |
| byd-dolphin | 88 | typical | 45 / **55** / 65 | LFP, flacher aber niedriger Peak |
| opel-corsa | 100 | typical | 50 / **58** / 70 | |
| mercedes-eqa | 135 | typical | 70 / **80** / 95 | |

Ohne Zeile: `typical` aus Peak ableiten.

---

## 3. Jahreszeit → Faktor auf DC-Leistung

Wohlfühlzone Akku grob **20–40 °C**. Faktor multipliziert **`avgKw_10_80`** (nicht die Minuten direkt).

```
avgKw_eff = avgKw_10_80 × tempFactorCharge(outdoorC, preconditioned)
t_charge_min = (E_stop_kWh / max(1, avgKw_eff)) × 60
t_stop_min   = t_charge_min + overheadMin
```

### `tempFactorCharge` (mid) — auf Leistung

| outdoorC | mit Vorkondi (Default) | ohne Vorkondi |
| --- | --- | --- |
| ≥ 20 °C | **1,00** | 1,00 |
| 10 °C | 0,97 | 0,90 |
| 0 °C | **0,90** | **0,65** |
| −7 °C | 0,85 | **0,55–0,60** |
| ≥ 30 °C (heiß) | 0,95 | 0,90 |

Interpolation linear zwischen Stützpunkten. Spanne: mid ± ~0,05 (mit Vorkondi) bzw. ± ~0,08 (ohne).

ADAC-Größenordnung Zeit ohne Vorkondi: ~+40 % bis +70 % (Zoe/e-Up ~40 %, ID.3 ~50 %, Model Y ~70 %) → Leistungsfaktor ~0,59–0,71 — passt zu 0,55–0,65 bei Frost.

### Vorkonditionierung

| | Lock |
| --- | --- |
| Default Autobahn-Check | **mit** Vorkondi angenommen (Navi-Ladestopp) — **als Annahme markieren** |
| Optional | Schalter/Szenario „ohne Vorkondi“ → Spalte ohne |
| Laien-Satz | „Im Winter vorher warmfahren oder Ladestopp im Auto-Navi setzen — sonst dauert’s oft spürbar länger.“ |

`overheadMin = 8` (Soft-Empfehlung beibehalten; Spanne 6–12 möglich, Mid 8).

---

## 4. Was wir nicht wissen → Annahme, keine Zusage

| Unbekannt | Annahme in Fahrklar | UI |
| --- | --- | --- |
| Konkrete Säule / Splitting | Säule trägt Auto-Peak (≥ peakKw) | Fuß: volle Säule / Doppelbelegung oft langsamer |
| Ob Vorkondi greift | ja, wenn Monat kalt | „Vorkonditionierung angenommen“ |
| Exakter Ankunfts-SoC | 10 % | — |
| Exakte Kurve pro VIN/Software | Katalog-Mid + Spanne | low/mid/high Minuten |
| Batteriealter / SoH | neuwertig | — |
| LFP vs NMC im Katalog | nur über Klasse/Peak | — |

Ausgabe immer als **Spanne**, nie als Navi-Zusage.

---

## 5. Übergabeformat an Ladezeit (`computeTripPlan`)

Pro Auto (oder Fallback aus Peak + Klasse):

```
peakKw: number                    # Referenz
avgKw_10_80: { low, mid, high }   # ~20 °C, Zeitbasis
curve?: optional feiner — v1 weglassen
tempFactorCharge(outdoorC, preconditioned: boolean) → { low, mid, high }
precondition: default true im Autobahn-Check; false = Malus über tempFactor
overheadMin: 8
E_stop = usableKwh * 0.70
firstLegKm = range100 * (startSoc - 0.10)
laterLegKm = range100 * 0.70
```

Zeit:

```
t_charge = E_stop / (avgKw_10_80 * tempFactorCharge) * 60
t_stop   = t_charge + 8
```

UI-Mid aus mid-Werten; Low/High aus avg- und temp-Spannen (und Stop-Anzahl aus Reichweiten-Spanne).

---

## Quellen (Orientierung)

ADAC Ladekurven/Winter; ADAC Seal Design Ø ~103 kW / 39 min 10–80; EVKX Ioniq 5 ~175 kW, ID.7 Pro ~122 kW; ChargeIn 08/2026 Peak vs. Mittel. Größenordnungen, Stand Sept 2026.
