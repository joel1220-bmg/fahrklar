# Fahrklar

Visuelle Orientierung für **neue E-Autos** in Deutschland. Ehrliche Autobahn-Reichweite als Spanne (Monat, Tempo, Temperatur) — kein Verkauf, kein Leasing-Vergleich.

Alle Zahlen entstehen im Browser (`lib/engine`). Kein Konto, keine Datenbank, kein LLM. Stand der Seed-Daten: **2026-09-12**.

## Starten

```bash
npm install
npm test
npx tsc --noEmit
npm run build
npm run dev
```

Öffnen: [http://localhost:3000](http://localhost:3000)

npm-Scripts sind Windows-tauglich (kein `VAR=1 cmd`).

## Routen

| Pfad | Inhalt |
| --- | --- |
| `/` | Landing — Showroom + drei Kacheln |
| `/berater` | Fragen → Ergebnis mit sichtbarer Kontrollleiste (ehemals „Feinschliff“-Schublade — entfernt, siehe `docs/backlog.md` #1) |
| `/datenschutz` | Platzhalter |
| `/impressum` | Platzhalter |

## Daten

- `data/cars.de.json` — 15 BEV-Neuwagen (Seed-Orientierung)
- `data/climate-months.de.json` — typische DE-Außentemperatur je Monat
- `data/routes.de.json` — Hamburg–München, Berlin–Köln, Stuttgart–Berlin

## Technik

Next.js App Router, TypeScript, Tailwind 4, react-three-fiber, Zod, Vitest. CSP, System-Fonts, Sie-Form, localStorage nur mit Opt-in. Copy-Lock: `lib/copy.ts` und `lib/engine/labels.ts`, gebunden an `intake-lock.md` und `ladekurve-lock.md`.
