import Link from "next/link";
import { COPY } from "@/lib/copy";

export function SiteFooter() {
  return (
    <footer className="no-print mt-auto border-t border-graphite-line/80">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>{COPY.notCertified}</p>
        <div className="flex gap-4">
          <Link href="/datenschutz" className="hover:text-paper">
            Datenschutz
          </Link>
          <Link href="/impressum" className="hover:text-paper">
            Impressum
          </Link>
        </div>
      </div>
    </footer>
  );
}
