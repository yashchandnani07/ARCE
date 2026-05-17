import { SectionHeader } from "./Pipeline";
import { LINKS } from "@/config";
import { DEMO_AUDIT, OPEN_PR } from "@/data/mock";

export function Governance() {
  const audit = DEMO_AUDIT;
  const pr = OPEN_PR;

  return (
    <section id="governance" className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Governance & Audit"
          title={
            <>
              Every patch, every reasoning step —{" "}
              <span className="font-editorial italic font-normal text-neon/95">
                forever defensible.
              </span>
            </>
          }
          desc="ARCE produces a compliance-ready audit trail for every remediation, and submits the patch as a governed pull request your reviewers can sign off on."
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          {/* Audit report */}
          <div className="glass-strong overflow-hidden rounded-2xl">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
              <span className="font-mono text-xs text-muted-foreground">audit.md</span>
              <span className="ml-auto chip !text-[10px]">verified</span>
            </div>
            <div className="font-mono text-[12.5px] leading-6 px-5 py-4">
              <p className="text-foreground/60"># ARCE Remediation Report</p>
              <p className="text-neon">
                ## {audit.cve} · {audit.package.name} {audit.package.from} → {audit.package.to}
              </p>
              <p className="mt-3 text-foreground/80">**Severity:** {audit.severity}</p>
              <p className="text-foreground/80">
                **Reachable:** {String(audit.reachable)} (yaml.load called in app.py)
              </p>
              <p className="text-foreground/80">**Verified by:** pytest + Playwright</p>
              <p className="mt-3 text-foreground/60">### Reasoning trace (Bob)</p>
              {audit.reasoning.map((line) => (
                <p key={line} className="text-foreground/80">- {line}</p>
              ))}
              <p className="mt-3 text-foreground/60">### Sign-off</p>
              <p className="text-foreground/80">
                agent: <span className="text-neon">{audit.signoff.agent}</span>
              </p>
              <p className="text-foreground/80">
                pipeline: <span className="text-foreground/60">{audit.signoff.pipeline}</span>
              </p>
            </div>
          </div>

          {/* PR preview (uses demo PR data) */}
          <div className="glass-strong overflow-hidden rounded-2xl">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
              <span className="font-mono text-xs text-muted-foreground">
                github.com/yashchandnani07/ARCE
              </span>
              <a
                href={LINKS.pr}
                target="_blank"
                rel="noreferrer"
                className="ml-auto chip !text-[10px] hover:text-neon"
              >
                PR #2 ↗
              </a>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-6 items-center rounded-full bg-neon/15 px-2 text-[10px] font-semibold uppercase tracking-wider text-neon ring-1 ring-neon/40">
                  Merged
                </span>
                <div>
                  <h4 className="font-display text-lg font-semibold">
                    Security: Patch {audit.cve} ({audit.package.name} unsafe load)
                  </h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Opened by <span className="text-neon">{pr.author}</span> · 2 files changed · audit.md attached
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-1.5 font-mono text-xs">
                <Diff sign="-" text={`${audit.package.name}==${audit.package.from}`} />
                <Diff sign="+" text={`${audit.package.name}==${audit.package.to}`} />
                <Diff sign="-" text="config = yaml.load(f)" />
                <Diff sign="+" text="config = yaml.safe_load(f)" />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                {[
                  ["3 / 3", "pytest"],
                  ["200 OK", "Playwright"],
                  ["1", "Self-correct"],
                ].map(([v, l]) => (
                  <div key={l} className="rounded-lg bg-white/[0.02] p-2 ring-1 ring-white/5">
                    <div className="font-display text-base text-neon">{v}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {l}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Diff({ sign, text }: { sign: "+" | "-"; text: string }) {
  const color =
    sign === "+"
      ? "text-neon bg-neon/[0.06]"
      : "text-[oklch(0.7_0.24_25)] bg-[oklch(0.7_0.24_25)]/[0.06]";
  return (
    <div className={`rounded px-2 py-1 ${color}`}>
      <span className="opacity-60 mr-2">{sign}</span>
      {text}
    </div>
  );
}
