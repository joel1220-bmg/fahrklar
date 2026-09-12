import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { COPY } from "@/lib/copy";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fahrklar — Neuwagen-Orientierung für E-Autos",
  description: COPY.underCta,
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-graphite text-ink">
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
