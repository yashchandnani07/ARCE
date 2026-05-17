import { MeshBackground } from "../MeshBackground";
import { LINKS } from "@/config";

export function FinalCTA() {
  return (
    <section className="relative isolate overflow-hidden py-32">
      <MeshBackground density={40} />
      <div className="absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-neon/[0.04] blur-[120px]" />
      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <span className="chip">Built for the IBM Bob Hackathon 2026</span>
        <h2 className="font-display mt-6 text-5xl font-medium leading-[1.02] tracking-[-0.03em] md:text-7xl">
          <span className="gradient-text">Let the agent handle</span>
          <br />
          <span className="font-editorial italic font-normal text-neon">the security toil.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
          Clone the repo, register the MCP servers, and watch Bob remediate a real CVE end-to-end —
          in under 90 seconds.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <a href={LINKS.github} target="_blank" rel="noreferrer" className="btn-neon">
            Clone on GitHub
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M5 12h14m-6-6 6 6-6 6" />
            </svg>
          </a>
          <a href={LINKS.quickStart} className="btn-ghost">Quick Start</a>
          <a href="/dashboard" className="btn-ghost">Launch console</a>
        </div>

        <div className="mt-10 font-mono text-xs text-muted-foreground">
          $ git clone {LINKS.github}.git &amp;&amp; cd ARCE &amp;&amp; .\setup-mcp.ps1
        </div>
      </div>
    </section>
  );
}
