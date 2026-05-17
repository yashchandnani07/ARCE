import { Logo } from "./Nav";
import { getFooterColumns } from "@/lib/api";

const COLUMNS = getFooterColumns();

export function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-background">
      <div className="grid-overlay absolute inset-0 opacity-40" />
      <div className="relative mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5">
              <Logo />
              <span className="font-display text-base font-semibold">ARCE</span>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              The Autonomous Remediation & Compliance Engine. Built for security teams that ship.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <span className="chip">SOC 2 Type II</span>
              <span className="chip">ISO 27001</span>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-foreground/60">
                {col.title}
              </div>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {col.items.map((it) => (
                  <li key={it}>
                    <a href="#" className="transition hover:text-neon">{it}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/5 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div>© {new Date().getFullYear()} ARCE Systems Inc. All rights reserved.</div>
          <div className="font-mono">arce://autonomous · made for security engineers</div>
        </div>
      </div>
    </footer>
  );
}
