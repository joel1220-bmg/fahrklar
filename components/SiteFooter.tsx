import Link from "next/link";
import { COPY } from "@/lib/copy";

export function SiteFooter() {
  return (
    <footer className="no-print mt-auto border-t border-line bg-surface">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>{COPY.notCertified}</p>
        <div className="flex gap-4">
          <Link
            href="/datenschutz"
            className="inline-flex min-h-11 items-center hover:text-accent"
          >
            Datenschutz
          </Link>
          <Link
            href="/impressum"
            className="inline-flex min-h-11 items-center hover:text-accent"
          >
            Impressum
          </Link>
        </div>
      </div>
    </footer>
  );
}
