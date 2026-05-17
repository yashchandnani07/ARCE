import { motion } from "framer-motion";
import { SectionHeader } from "./Pipeline";
import { getEcosystemCards } from "@/lib/api";

const CARDS = getEcosystemCards();

export function Ecosystem() {
  return (
    <section id="ecosystem" className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Ecosystem"
          title={
            <>
              Plug ARCE into{" "}
              <span className="font-editorial italic font-normal text-neon/95">
                every agent and pipeline.
              </span>
            </>
          }
          desc="Native MCP server, first-class CLI, GitHub App, and SDK for custom workflows."
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-5">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative lg:col-span-3"
          >
            <div className="glass-strong relative overflow-hidden rounded-2xl p-8">
              <div className="grid-overlay absolute inset-0 opacity-50" />
              <ArchDiagram />
            </div>
          </motion.div>

          <div className="space-y-4 lg:col-span-2">
            {CARDS.map((c) => (
              <div key={c.title} className="glass rounded-2xl p-5">
                <h3 className="font-display text-lg font-semibold">{c.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
                <pre className="mt-3 rounded-lg bg-black/40 px-3 py-2 font-mono text-xs text-neon ring-1 ring-white/5">
                  {c.code}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const SATELLITES = [
  { x: 80, y: 70, label: "pip-audit", sub: "OSV.dev" },
  { x: 520, y: 70, label: "arce-tools", sub: "FastMCP" },
  { x: 80, y: 290, label: "pytest", sub: "self-correct" },
  { x: 520, y: 290, label: "Playwright", sub: "MCP · E2E" },
  { x: 300, y: 30, label: "GitHub", sub: "gh CLI · PRs" },
  { x: 300, y: 330, label: "Streamlit", sub: "governance UI" },
];

function ArchDiagram() {
  return (
    <svg viewBox="0 0 600 360" className="relative w-full">
      <defs>
        <linearGradient id="line" x1="0" x2="1">
          <stop offset="0%" stopColor="oklch(0.92 0.27 130)" stopOpacity="0" />
          <stop offset="50%" stopColor="oklch(0.92 0.27 130)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="oklch(0.92 0.27 130)" stopOpacity="0" />
        </linearGradient>
        <filter id="glow"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>

      <g>
        <circle cx="300" cy="180" r="60" fill="oklch(0.92 0.27 130 / 0.08)" stroke="oklch(0.92 0.27 130 / 0.6)" strokeWidth="1.5" />
        <circle cx="300" cy="180" r="60" fill="none" stroke="oklch(0.92 0.27 130)" strokeWidth="0.5" filter="url(#glow)" />
        <text x="300" y="176" textAnchor="middle" fill="oklch(0.97 0.01 150)" fontSize="14" fontFamily="Space Grotesk" fontWeight="600">IBM Bob</text>
        <text x="300" y="194" textAnchor="middle" fill="oklch(0.92 0.27 130)" fontSize="9" fontFamily="JetBrains Mono">COMPLIANCE-REMEDIATOR</text>
      </g>

      {SATELLITES.map((n) => (
        <g key={n.label}>
          <line x1="300" y1="180" x2={n.x} y2={n.y} stroke="url(#line)" strokeWidth="1" />
          <circle cx={n.x} cy={n.y} r="22" fill="oklch(0.16 0.012 150)" stroke="oklch(1 0 0 / 0.15)" />
          <circle cx={n.x} cy={n.y} r="3" fill="oklch(0.92 0.27 130)">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <text x={n.x} y={n.y + 44} textAnchor="middle" fill="oklch(0.97 0.01 150)" fontSize="11" fontFamily="Inter" fontWeight="500">{n.label}</text>
          <text x={n.x} y={n.y + 56} textAnchor="middle" fill="oklch(0.65 0.02 150)" fontSize="9" fontFamily="JetBrains Mono">{n.sub}</text>
        </g>
      ))}
    </svg>
  );
}
