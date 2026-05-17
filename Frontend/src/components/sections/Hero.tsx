import { motion } from "framer-motion";
import { SplineScene } from "@/components/ui/splite";
import { Spotlight } from "@/components/ui/spotlight";
import { MeshBackground } from "../MeshBackground";
import { Terminal } from "../Terminal";
import { LINKS } from "@/config";
import { BOB_ACTIVITY, HERO_METRICS } from "@/data/mock";

const METRIC_COLORS: Record<string, string> = {
  ok: "text-neon",
  ai: "text-[oklch(0.78_0.16_200)]",
  info: "text-foreground/80",
  err: "text-[oklch(0.7_0.24_25)]",
};

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden pt-36 pb-24 md:pt-44 md:pb-32">
      {/* Lightweight canvas mesh — always on, cheap */}
      <MeshBackground />
      {/* Optional 3D Spline — only loads on desktop / good network, lazy + idle */}
      <div className="pointer-events-none absolute inset-0 -z-10 hidden lg:block">
        <Spotlight className="-top-40 left-0 md:-top-20 md:left-60" fill="oklch(0.92 0.27 130)" />
        <div className="absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]">
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="h-full w-full"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background" />
      </div>
      <div className="grid-overlay absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[700px] -translate-x-1/2 rounded-full bg-neon/[0.04] blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mx-auto flex max-w-3xl flex-col items-center text-center"
        >
          <span className="chip">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-neon" />
            </span>
            ARCE / v1.4 — autonomous remediation, live
          </span>

          <h1 className="font-display mt-8 text-5xl font-medium leading-[0.98] tracking-[-0.035em] md:text-[5.5rem]">
            <span className="gradient-text">Autonomous</span>{" "}
            <span className="font-editorial italic font-normal text-neon/95">DevSecOps,</span>
            <br />
            <span className="gradient-text">end</span>{" "}
            <span className="font-editorial italic font-normal">to</span>{" "}
            <span className="gradient-text">end.</span>
          </h1>

          <p className="mt-7 max-w-2xl text-[15px] leading-relaxed text-muted-foreground md:text-[17px]">
            A CVE arrives. ARCE <span className="text-foreground/90">verifies reachability</span>,
            patches the dependency, runs the suite, reads the failure,
            <span className="font-editorial italic text-neon/90"> reasons about the breaking API</span>,
            rewrites the fix, re-tests, drives the live app with Playwright, and opens a governed pull request —
            with a compliance-ready audit trail attached. The human stays in control. The agent handles the toil.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a href={LINKS.quickStart} className="btn-neon">
              Quick Start
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </a>
            <a href="#demo" className="btn-ghost">
              <svg className="h-4 w-4 text-neon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Live Demo
            </a>
            <a href={LINKS.pr} target="_blank" rel="noreferrer" className="btn-ghost">
              View governed PR ↗
            </a>
            <a href={LINKS.github} target="_blank" rel="noreferrer" className="btn-ghost">
              GitHub ↗
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
            <span className="font-mono">▸ 9-step closed-loop pipeline</span>
            <span className="font-mono">▸ 2 MCP servers · 4 custom tools</span>
            <span className="font-mono">▸ $0 cost · fully open-source</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="relative mx-auto mt-16 max-w-5xl"
        >
          <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-neon/[0.03] blur-3xl" />
          <div className="relative grid gap-4 md:grid-cols-5">
            <div className="md:col-span-3">
              <Terminal />
            </div>
            <DashboardPreviewCard />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function DashboardPreviewCard() {
  return (
    <div className="md:col-span-2 flex flex-col gap-4">
      <div className="glass-strong rounded-2xl p-5 float-slow">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Run · #demo-app</span>
          <span className="chip !text-[10px]">Verified</span>
        </div>
        <div className="mt-3 flex items-end gap-2">
          <span className="font-editorial italic text-6xl leading-none text-neon">86</span>
          <span className="font-display text-2xl font-light text-neon/80">s</span>
          <span className="pb-2 text-sm text-muted-foreground">detect → PR</span>
        </div>
        <ScoreBar value={92} />
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {HERO_METRICS.map((m) => (
            <div key={m.label} className="rounded-lg bg-white/[0.02] p-2 ring-1 ring-white/5">
              <div className={`font-display text-lg ${METRIC_COLORS[m.tone ?? "info"]}`}>
                {m.value}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Bob activity</span>
          <span className="font-mono text-[10px] text-neon">● running</span>
        </div>
        <ul className="mt-3 space-y-2.5 font-mono text-xs">
          {BOB_ACTIVITY.map((row) => (
            <li key={row.text} className="flex items-center justify-between">
              <span className="text-foreground/80">→ {row.text}</span>
              <span className="text-muted-foreground">{row.ago}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ScoreBar({ value }: { value: number }) {
  return (
    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
      <div
        className="h-full rounded-full bg-gradient-to-r from-neon to-[oklch(0.7_0.18_200)]"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
