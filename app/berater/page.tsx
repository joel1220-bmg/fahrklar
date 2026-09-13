import type { Metadata } from "next";
import { AdvisorApp } from "@/components/advisor/AdvisorApp";
import { COPY } from "@/lib/copy";

export const metadata: Metadata = {
  title: "Berater · Stromstrecke",
  description: COPY.underCta,
};

export default function BeraterPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:pt-12">
      <p className="text-sm font-medium uppercase tracking-[0.14em] text-gold">Berater</p>
      <h1 className="serif mt-2 text-3xl text-paper sm:text-4xl">Passende Neuwagen finden</h1>
      <p className="mt-3 max-w-xl text-muted">{COPY.underCta}</p>
      <div className="mt-10">
        <AdvisorApp />
      </div>
    </div>
  );
}
