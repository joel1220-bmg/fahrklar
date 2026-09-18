import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum · Stromstrecke",
  alternates: { canonical: "/impressum" },
};

/*
 * Transcribed 18.09.2026 from what stromstrecke.de was actually serving.
 *
 * This file said "Platzhalter. Vor Veröffentlichung durch eine Rechtsberatung
 * ersetzen" while the live site carried the real details, and the real text
 * was in no commit on any branch - it had been written outside the repository.
 * A deploy from here would have replaced a German site's Impressum with that
 * placeholder, and the Impressum is the one page that may not be missing.
 *
 * Whatever produced the live version is still a second source of truth. Find
 * it and retire it, or the next deploy is a coin toss again.
 */
export default function ImpressumPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 leading-relaxed">
      <h1 className="serif text-3xl text-paper">Impressum</h1>
      <address className="mt-6 not-italic text-paper">
        Joel Schoenmakers
        <br />
        Mutter-Ey-Str. 29
        <br />
        41189 Mönchengladbach
      </address>
      <p className="mt-4 text-paper">E-Mail: joel@schoenmakers-it.de</p>
    </article>
  );
}
