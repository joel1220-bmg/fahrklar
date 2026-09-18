import type { Metadata } from "next";
import Link from "next/link";
import { ChargingScene } from "@/components/showroom/ChargingScene";
import { COPY, LANDING_TILES } from "@/lib/copy";

/* Per page, never in the layout: a canonical set on the root element is
   inherited by every route, so /berater would name the home page as the
   original and ask to be dropped from the index. It also settles the
   www-versus-bare-domain duplicate, which serves both without redirecting. */
export const metadata: Metadata = { alternates: { canonical: "/" } };

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
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-gold">
            {COPY.eyebrow}
          </p>
          <h1 className="serif mt-4 text-[2.15rem] leading-[1.12] text-paper sm:text-5xl sm:leading-[1.1]">
            {COPY.landingLead}
          </h1>
          {/* The reader's actual fear, named out loud. Everything else on this
              page promised honesty about range in the abstract; nothing said
              which worry that honesty is for. The privacy line used to sit
              here - true, but not what someone anxious about a long drive
              needs to read second. */}
          <p className="mt-5 text-lg leading-relaxed text-ink">
            {COPY.longDistancePromise}
          </p>
          <p className="mt-3 text-sm text-muted">{COPY.privacy}</p>
          <CtaBlock className="mt-9 hidden lg:flex" />
        </div>

        {/* Was a three.js canvas. It took fifteen to twenty seconds to appear
            and arrived as a faceted extruded body; a flat drawing says the same
            thing instantly and does not pretend to be a photograph. */}
        <div className="rounded-2xl bg-sunken p-5 sm:p-7">
          <ChargingScene className="h-auto w-full" />
        </div>

        <CtaBlock className="lg:hidden" />
      </section>

      <ol className="mt-16 grid gap-4 sm:grid-cols-3 sm:gap-5">
        {LANDING_TILES.map((tile) => (
          <li
            key={tile.title}
            className="rounded-2xl border border-line bg-surface px-5 py-5"
          >
            <p className="serif text-lg text-accent">{tile.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{tile.body}</p>
          </li>
        ))}
      </ol>

      <p className="mt-10 max-w-3xl text-xs leading-relaxed text-muted">{COPY.wltpAlways}</p>
    </div>
  );
}
