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

function CtaBlock({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-start gap-3 ${className}`}>
      <Link
        href="/berater"
        className="inline-flex min-h-12 items-center rounded-full bg-gold px-7 text-base font-semibold text-graphite hover:bg-gold-dim"
      >
        {COPY.cta}
      </Link>
      <p className="max-w-md text-sm leading-relaxed text-muted">{COPY.underCta}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
      <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        <div className="max-w-xl">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-gold">Fahrklar</p>
          <h1 className="serif mt-4 text-[2.15rem] leading-[1.12] text-paper sm:text-5xl sm:leading-[1.1]">
            Ein neues E-Auto, das zu Ihrem Alltag passt — mit ehrlicher Reichweite, nicht mit
            Prüfstandszahlen.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">{COPY.privacy}</p>
          <CtaBlock className="mt-9 hidden lg:flex" />
        </div>

        <CarCanvas
          body="crossover"
          color="#4A6FA5"
          className="min-h-[280px] h-[44vh] w-full sm:h-[48vh] lg:h-[min(52vh,520px)]"
        />

        <CtaBlock className="lg:hidden" />
      </section>

      <ol className="mt-16 grid gap-4 sm:grid-cols-3 sm:gap-5">
        {TILES.map((tile) => (
          <li
            key={tile.t}
            className="rounded-2xl border border-graphite-line bg-graphite-card/90 px-5 py-5"
          >
            <p className="serif text-lg text-gold">{tile.t}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{tile.d}</p>
          </li>
        ))}
      </ol>

      <p className="mt-10 max-w-3xl text-xs leading-relaxed text-muted">{COPY.wltpAlways}</p>
    </div>
  );
}
