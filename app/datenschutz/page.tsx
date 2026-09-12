import type { Metadata } from "next";
import { COPY } from "@/lib/copy";

export const metadata: Metadata = { title: "Datenschutz · Fahrklar" };

export default function DatenschutzPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 leading-relaxed">
      <h1 className="serif text-3xl text-paper">Datenschutz</h1>
      <p className="mt-4 text-muted">
        Platzhalter — vor Veröffentlichung durch eine Rechtsberatung ersetzen.
      </p>
      <h2 className="serif mt-8 text-xl text-gold">Verantwortliche Stelle</h2>
      <p className="mt-2 text-paper">[Name, Anschrift, Kontakt — Platzhalter]</p>
      <h2 className="serif mt-8 text-xl text-gold">Verarbeitung</h2>
      <p className="mt-2 text-paper">
        Fahrklar rechnet ausschließlich in Ihrem Browser. Nur wenn Sie „Angaben merken“ ankreuzen,
        speichert dieser Browser den Entwurf in <code>localStorage</code>. Ohne Haken wird nichts
        geschrieben. Es gibt kein Nutzerkonto, keinen Server für Ihre Fahrdaten, keinen Newsletter
        und keine Tracker oder Werbung.
      </p>
      <p className="mt-2 text-muted">{COPY.privacy}</p>
      <p className="mt-2 text-muted">{COPY.remember}</p>
      <p className="mt-1 text-muted">{COPY.rememberOff}</p>
      <h2 className="serif mt-8 text-xl text-gold">Ihre Rechte</h2>
      <p className="mt-2 text-paper">
        Sie können den Entwurf jederzeit im Berater zurücksetzen. Darüber hinaus gelten die Rechte
        nach DSGVO (Auskunft, Löschung usw.) gegenüber der verantwortlichen Stelle.
      </p>
    </article>
  );
}
