import type { Metadata } from "next";

export const metadata: Metadata = { title: "Impressum · Fahrklar" };

export default function ImpressumPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 leading-relaxed">
      <h1 className="serif text-3xl text-paper">Impressum</h1>
      <p className="mt-4 text-muted">
        Platzhalter. Vor Veröffentlichung durch eine Rechtsberatung ersetzen.
      </p>
      <p className="mt-6 text-paper">[Name, Anschrift, Kontakt: Platzhalter]</p>
    </article>
  );
}
