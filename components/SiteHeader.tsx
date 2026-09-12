import Link from "next/link";

/**
 * Two rules, no shadow, no blur: the header should sit on the page the way a
 * masthead sits on a report, not float over it. The accent hairline under the
 * bar is the only colour up here.
 */
export function SiteHeader() {
  return (
    <header className="no-print border-b border-line bg-surface">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="serif text-lg tracking-wide text-ink">
          Fahrklar
        </Link>
        <nav aria-label="Hauptnavigation" className="flex gap-5 text-sm text-muted">
          <Link href="/berater" className="hover:text-accent">
            Berater
          </Link>
          <Link href="/datenschutz" className="hover:text-accent">
            Datenschutz
          </Link>
        </nav>
      </div>
      <div aria-hidden className="h-0.5 bg-accent" />
    </header>
  );
}
