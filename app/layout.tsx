import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { COPY } from "@/lib/copy";
import "./globals.css";

const TITLE = "Stromstrecke · Neuwagen-Orientierung für E-Autos";
const URL_BASE = "https://stromstrecke.de";

/*
 * Extended 18.09.2026.
 *
 * Until then the only tags here were title, description and robots, so a link
 * to stromstrecke.de pasted into LinkedIn, Slack or WhatsApp arrived as a bare
 * URL with no card. For a site whose whole purpose is to be shown to someone,
 * that is the first impression, and it was blank.
 *
 * `metadataBase` is what turns the relative image path below into the absolute
 * URL every scraper requires; without it Next drops the tag and says so only
 * as a build warning.
 *
 * The colon in the title became a middot at the same time. Every other page
 * here already reads "Impressum · Stromstrecke", and the house rule for this
 * site's copy is no colons.
 */
export const metadata: Metadata = {
  metadataBase: new URL(URL_BASE),
  title: TITLE,
  description: COPY.underCta,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "de_DE",
    siteName: "Stromstrecke",
    title: TITLE,
    description: COPY.underCta,
    url: "/",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: COPY.underCta,
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-canvas text-ink">
        <a className="skip-link" href="#inhalt">
          Zum Inhalt
        </a>
        <SiteHeader />
        <main id="inhalt" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
