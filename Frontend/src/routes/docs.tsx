import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { LINKS } from "@/config";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Quick Start — ARCE" },
      { name: "description", content: "Clone ARCE, register the MCP servers in IBM Bob, and run the 9-step autonomous remediation pipeline end-to-end." },
      { property: "og:title", content: "ARCE — Quick Start" },
      { property: "og:description", content: "Run the full autonomous CVE remediation pipeline with IBM Bob in under 5 minutes." },
    ],
  }),
  component: DocsPage,
});

function DocsPage() {
  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased">
      <Nav />
      <main className="relative mx-auto max-w-4xl px-6 pt-36 pb-28">
        <span className="chip">Quick Start</span>
        <h1 className="font-display mt-5 text-4xl font-semibold tracking-tight md:text-5xl gradient-text">
          Run ARCE end-to-end <span className="text-neon">in 5 minutes.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          ARCE orchestrates IBM Bob through a custom <span className="font-mono text-neon">compliance-remediator</span> mode with two MCP servers to remediate a real CVE in a Flask demo app — autonomously.
        </p>

        <Section n="01" title="Prerequisites">
          <ul className="space-y-1.5 text-sm text-foreground/80">
            <li>· Python 3.10+ &nbsp;·&nbsp; Node.js 18+</li>
            <li>· Git + GitHub CLI <Code>winget install GitHub.cli</Code></li>
            <li>· IBM Bob IDE (hackathon-provided)</li>
          </ul>
        </Section>

        <Section n="02" title="Clone & setup">
          <Pre>{`git clone ${LINKS.github}.git
cd ARCE

# Automated setup
.\\setup-mcp.ps1

# — OR — manual
python -m venv venv
.\\venv\\Scripts\\Activate.ps1
pip install fastmcp pytest pip-audit flask "pyyaml==5.3.1" streamlit
npx playwright install
gh auth login`}</Pre>
        </Section>

        <Section n="03" title="Verify the vulnerability">
          <Pre>{`.\\venv\\Scripts\\pip-audit.exe --format json -r demo-app/requirements.txt`}</Pre>
          <p className="mt-3 text-sm text-muted-foreground">
            Should flag <span className="font-mono text-neon">pyyaml==5.3.1</span> with <span className="font-mono text-neon">CVE-2020-14343</span> (arbitrary code execution via unsafe YAML deserialization).
          </p>
        </Section>

        <Section n="04" title="Configure Bob">
          <ul className="space-y-1.5 text-sm text-foreground/80">
            <li>· Open Bob IDE → Settings → MCP Servers</li>
            <li>· Add <span className="font-mono text-neon">arce-tools</span> and <span className="font-mono text-neon">playwright</span> servers</li>
            <li>· Verify both show <span className="text-neon">✓ Connected</span></li>
          </ul>
        </Section>

        <Section n="05" title="Trigger the pipeline">
          <p className="text-sm text-muted-foreground">Switch to <span className="font-mono text-neon">ARCE Compliance Remediator</span> mode in Bob, then paste:</p>
          <Pre>{`I have scanned the demo-app directory with pip-audit and found vulnerabilities.
Here is the output: <paste CVE JSON>
Please execute the full remediation pipeline on the demo-app/ directory.`}</Pre>
          <p className="mt-3 text-sm text-muted-foreground">Watch Bob autonomously execute all 9 steps.</p>
        </Section>

        <Section n="06" title="Verify the results">
          <Pre>{`type demo-app\\app.py          # yaml.load(f) → yaml.safe_load(f) ✓
type demo-app\\requirements.txt # pyyaml upgraded ✓
type audit.md                  # Full compliance document ✓

cd dashboard && streamlit run streamlit_app.py`}</Pre>
        </Section>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          <LinkCard title="Governed PR" desc="PR #2 created by Bob with audit.md as the body." href={LINKS.pr} />
          <LinkCard title="GitHub Repo" desc="Full source: Flask demo, MCP server, dashboard." href={LINKS.github} />
          <LinkCard title="Bob Report" desc="Exported reasoning sessions from the Bob IDE." href={LINKS.bobReport} />
        </div>

        <div className="mt-16 glass rounded-2xl p-6">
          <h3 className="font-display text-lg font-semibold">Reset for a fresh demo run</h3>
          <Pre>{`git checkout main
git reset --hard origin/main
.\\venv\\Scripts\\pip.exe install "pyyaml==5.3.1" --force-reinstall`}</Pre>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-neon">{n}</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>
      <h2 className="font-display mt-3 text-2xl font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Pre({ children }: { children: string }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-xl bg-black/40 p-4 font-mono text-xs leading-6 text-neon ring-1 ring-white/5">
      {children}
    </pre>
  );
}

function Code({ children }: { children: string }) {
  return <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-neon">{children}</code>;
}

function LinkCard({ title, desc, href }: { title: string; desc: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="glass group block rounded-2xl p-5 transition hover:border-neon/40">
      <div className="flex items-center justify-between">
        <h4 className="font-display text-base font-semibold">{title}</h4>
        <span className="text-neon transition group-hover:translate-x-0.5">↗</span>
      </div>
      <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
    </a>
  );
}
