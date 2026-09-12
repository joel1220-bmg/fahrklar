import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="no-print border-b border-graphite-line/80 bg-graphite/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="serif text-lg tracking-wide text-gold">
          Fahrklar
        </Link>
        <nav className="flex gap-4 text-sm text-muted">
          <Link href="/berater" className="hover:text-paper">
            Berater
          </Link>
          <Link href="/datenschutz" className="hover:text-paper">
            Datenschutz
          </Link>
        </nav>
      </div>
    </header>
  );
}
