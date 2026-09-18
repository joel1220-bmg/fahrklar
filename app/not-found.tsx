import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Seite nicht gefunden · Stromstrecke" };

/*
 * Added 18.09.2026. Until then a wrong address on stromstrecke.de answered
 * with Next.js's built-in page: "This page could not be found.", in English,
 * on an otherwise entirely German site, under the title of the home page.
 *
 * The status code was always a real 404, so this was never a crawling problem
 * - it was the framework showing through, on the one page a visitor reaches by
 * accident and reads carefully because something has gone wrong.
 *
 * The two links are the point. A dead end that only apologises makes the
 * visitor use the back button; naming the two places worth going lets them
 * carry on instead.
 */
export default function NotFound() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-16 leading-relaxed">
      <p className="text-sm font-medium uppercase tracking-[0.14em] text-gold">
        Fehler 404
      </p>
      <h1 className="serif mt-2 text-3xl text-paper sm:text-4xl">
        Diese Seite gibt es nicht
      </h1>
      <p className="mt-4 text-muted">
        Vielleicht hat sich die Adresse geändert oder ein Zeichen fehlt. Nichts
        ist kaputt, hier geht es weiter.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/berater"
          className="inline-flex min-h-12 items-center rounded-full bg-gold px-7 text-base font-semibold text-graphite hover:bg-gold-dim"
        >
          Zum Berater
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-12 items-center rounded-full border border-graphite-line px-5 text-base text-paper hover:border-gold"
        >
          Zur Startseite
        </Link>
      </div>
    </article>
  );
}
