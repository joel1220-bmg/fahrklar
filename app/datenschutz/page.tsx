import type { Metadata } from "next";
import { COPY } from "@/lib/copy";

export const metadata: Metadata = {
  title: "Datenschutz · Stromstrecke",
  alternates: { canonical: "/datenschutz" },
};

/*
 * Transcribed 18.09.2026 from what stromstrecke.de was actually serving, for
 * the same reason as `app/impressum/page.tsx`: this file still carried the
 * placeholder and a thin "Ihre Rechte" paragraph, while the live page had the
 * full text - responsible party, hosting, retention, Widerspruchsrecht - which
 * existed in no commit on any branch.
 *
 * Transcribed, not edited. The wording here is the operator's legal statement
 * and not something to improve in passing. Two things were noticed while
 * copying and deliberately left alone, to be raised with him instead:
 *
 * - lima-city sets a `_lcp` cookie on every request, valid into 2034, and this
 *   text does not mention it. Strictly necessary cookies need no consent, but
 *   they do belong in the statement, and "Ohne Haken wird nichts geschrieben"
 *   currently reads as though nothing at all is stored.
 * - The three COPY lines below are UI strings quoted into the legal text. That
 *   may well be intentional - it shows the reader the exact wording used on
 *   the form - but they read as stray fragments between two full sections.
 */
export default function DatenschutzPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 py-12 leading-relaxed">
      <h1 className="serif text-3xl text-paper">Datenschutz</h1>

      <h2 className="serif mt-8 text-xl text-gold">Verantwortlich</h2>
      <address className="mt-2 not-italic text-paper">
        Joel Schoenmakers
        <br />
        Mutter-Ey-Str. 29
        <br />
        41189 Mönchengladbach
        <br />
        joel@schoenmakers-it.de
      </address>

      <h2 className="serif mt-8 text-xl text-gold">Verarbeitung</h2>
      <p className="mt-2 text-paper">
        Stromstrecke rechnet ausschließlich in Ihrem Browser. Nur wenn Sie „Angaben merken“ ankreuzen,
        speichert dieser Browser den Entwurf in <code>localStorage</code>. Ohne Haken wird nichts
        geschrieben. Es gibt kein Nutzerkonto, keinen Server für Ihre Fahrdaten, keinen Newsletter
        und keine Tracker oder Werbung.
      </p>
      <p className="mt-2 text-muted">{COPY.privacy}</p>
      <p className="mt-2 text-muted">{COPY.remember}</p>
      <p className="mt-1 text-muted">{COPY.rememberOff}</p>

      <h2 className="serif mt-8 text-xl text-gold">Hosting</h2>
      <p className="mt-2 text-paper">
        Die Seite liegt bei lima-city (TrafficPlex GmbH, Bremen) auf Servern in Deutschland. Beim
        Aufruf speichert lima-city Protokolldaten, insbesondere IP-Adresse, eine Kennung des
        Zugriffs und Angaben zum Browser, um den sicheren Betrieb zu gewährleisten. Ohne diese Daten
        lässt sich die Seite nicht ausliefern. Rechtsgrundlage ist das berechtigte Interesse an
        einem sicheren Betrieb (Art. 6 Abs. 1 lit. f DSGVO). lima-city handelt als
        Auftragsverarbeiter (Art. 28 DSGVO) und löscht die Protokolldaten nach sieben Tagen.
      </p>

      <h2 className="serif mt-8 text-xl text-gold">E-Mail</h2>
      <p className="mt-2 text-paper">
        Wenn Sie eine E-Mail schreiben, wird sie nur zur Beantwortung verwendet (Art. 6 Abs. 1 lit. f
        DSGVO) und gelöscht, sobald die Anfrage erledigt ist.
      </p>

      <h2 className="serif mt-8 text-xl text-gold">Ihre Rechte</h2>
      <p className="mt-2 text-paper">
        Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung und
        Datenübertragbarkeit (Art. 15 bis 20 DSGVO) sowie das Recht, sich bei einer
        Datenschutz-Aufsichtsbehörde zu beschweren (Art. 77 DSGVO). Den gemerkten Entwurf können Sie
        jederzeit im Berater zurücksetzen.
      </p>
      <p className="mt-4 text-paper">
        <strong>Widerspruchsrecht:</strong> Sie können der Verarbeitung auf Grundlage von Art. 6
        Abs. 1 lit. f DSGVO jederzeit aus Gründen, die sich aus Ihrer besonderen Situation ergeben,
        widersprechen (Art. 21 DSGVO).
      </p>
    </article>
  );
}
