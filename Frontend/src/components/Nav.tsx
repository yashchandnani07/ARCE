import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getNavItems } from "@/lib/api";
import { LINKS } from "@/config";

const NAV_ITEMS = getNavItems();

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "py-2" : "py-4"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6">
        <div
          className={`flex w-full items-center justify-between rounded-full px-5 py-2.5 transition-all ${
            scrolled ? "glass-strong" : ""
          }`}
        >
          <Link to="/" className="flex items-center gap-2.5">
            <Logo />
            <span className="font-display text-[15px] font-semibold tracking-tight">ARCE</span>
            <span className="hidden font-mono text-[10px] text-muted-foreground sm:inline">
              v1.4 · stable
            </span>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            {NAV_ITEMS.map(({ label, href }) =>
              href.startsWith("/") ? (
                <Link
                  key={label}
                  to={href}
                  className="text-sm text-foreground/70 transition hover:text-neon"
                >
                  {label}
                </Link>
              ) : (
                <a
                  key={label}
                  href={href}
                  className="text-sm text-foreground/70 transition hover:text-neon"
                >
                  {label}
                </a>
              ),
            )}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={LINKS.github}
              target="_blank"
              rel="noreferrer"
              className="hidden text-sm text-foreground/70 transition hover:text-neon md:inline"
            >
              GitHub ↗
            </a>
            <Link to="/dashboard" className="btn-neon !py-2 !px-4 !text-[13px]">
              Launch console →
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`relative inline-flex h-7 w-7 items-center justify-center rounded-md bg-neon/10 ring-1 ring-neon/40 ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-neon" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
      <span className="absolute inset-0 rounded-md bg-neon/10 blur-sm" />
    </span>
  );
}
