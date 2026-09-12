import Link from "next/link";
import { CarCanvas } from "@/components/showroom/CarCanvas";
import { COPY } from "@/lib/copy";

const TILES = [
  {
    t: "Alltag zuerst.",
    d: "Wenige Fragen zu Weg, Laden und Platz. Weiß ich nicht ist immer erlaubt.",
  },
  {
    t: "Reichweite als Spanne.",
    d: "Prüfstand (WLTP) übersetzen wir. Im Alltag, auf der Autobahn und im Winter ist es oft weniger.",
  },
  {
    t: "Kaufpreis grob.",
    d: "Listenpreis als Orientierung. Keine Leasingrate, die den Preis versteckt.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:pt-12">
      <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-gold">Fahrklar</p>
          <h1 className="serif mt-3 max-w-[22ch] text-[2.05rem] leading-[1.15] text-paper sm:text-5xl">
            Ein neues E-Auto, das zu Ihrem Alltag passt — mit ehrlicher Reichweite, nicht mit
            Prüfstandszahlen.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">{COPY.privacy}</p>
          <div className="mt-8 flex flex-col items-start gap-3">
            <Link
              href="/berater"
              className="inline-flex min-h-12 items-center rounded-full bg-gold px-6 text-base font-semibold text-graphite hover:bg-gold-dim"
            >
              {COPY.cta}
            </Link>
            <p className="max-w-md text-sm text-muted">{COPY.underCta}</p>
          </div>
        </div>
        <CarCanvas body="crossover" color="#4A6FA5" className="min-h-[280px] h-[38vh] lg:h-[420px]" />
      </div>

      <ol className="mt-14 grid gap-4 sm:grid-cols-3">
        {TILES.map((tile) => (
          <li key={tile.t} className="rounded-2xl border border-graphite-line bg-graphite-card p-4">
            <p className="serif text-lg text-gold">{tile.t}</p>
            <p className="mt-1 text-sm text-muted">{tile.d}</p>
          </li>
        ))}
      </ol>
      <p className="mt-8 text-xs text-muted">{COPY.wltpAlways}</p>
    </div>
  );
}
