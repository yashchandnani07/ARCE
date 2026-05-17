import { motion } from "framer-motion";
import { SectionHeader } from "./Pipeline";

export function DashboardPreview() {
  return (
    <section id="dashboard-preview" className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Console"
          title={<>A command center built for <span className="font-editorial italic font-normal text-neon/95">DevSecOps velocity.</span></>}
          desc="Posture, posture-by-repo, AI activity, and audit — all from one view."
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="relative mx-auto mt-14 max-w-6xl"
        >
          <div className="absolute -inset-8 rounded-[2.5rem] bg-neon/[0.03] blur-3xl" />
          <div className="relative overflow-hidden rounded-3xl glass-strong noise">
            <div className="flex items-center gap-2 border-b border-white/10 bg-black/30 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.7_0.24_25)]/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.83_0.18_85)]/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-neon/80" />
              <span className="ml-3 font-mono text-xs text-muted-foreground">arce.console / overview</span>
            </div>

            <div className="grid gap-4 p-6 lg:grid-cols-12">
              {/* KPIs */}
              <div className="grid grid-cols-2 gap-3 lg:col-span-4">
                <Kpi label="Security Score" value="94" delta="+6.2" />
                <Kpi label="Open Critical" value="0" delta="−3" tone="ok" />
                <Kpi label="Remediated 24h" value="38" delta="+12" tone="ok" />
                <Kpi label="AI Success" value="99.4%" delta="+0.3" tone="ok" />
              </div>

              {/* Chart */}
              <div className="glass rounded-2xl p-5 lg:col-span-8">
                <div className="flex items-center justify-between">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Remediations · 30d</div>
                  <div className="flex gap-2 text-[11px] text-muted-foreground">
                    <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-neon" />Auto-patched</span>
                    <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[oklch(0.7_0.18_200)]" />Self-corrected</span>
                  </div>
                </div>
                <Sparkline />
              </div>

              {/* Repos */}
              <div className="glass rounded-2xl p-5 lg:col-span-7">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">Live repository activity</div>
                  <span className="font-mono text-[10px] text-neon">● streaming</span>
                </div>
                <ul className="divide-y divide-white/5">
                  {[
                    ["acme/payments-api", "PR #1428 opened", "ws@8.18.0", "ok"],
                    ["acme/web-shop", "Patch verified", "lodash@4.17.21", "ok"],
                    ["acme/internal-tools", "AI self-correcting", "axios@1.7.4", "ai"],
                    ["acme/data-warehouse", "Reachability scan", "—", "info"],
                    ["acme/legacy-cms", "CVE detected", "express@4.17.1", "err"],
                  ].map(([repo, action, dep, t]) => (
                    <li key={repo as string} className="flex items-center gap-3 py-2.5 text-sm">
                      <Dot tone={t as any} />
                      <span className="font-mono text-foreground/90">{repo}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-foreground/70">{action}</span>
                      <span className="ml-auto font-mono text-xs text-muted-foreground">{dep}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Vulns */}
              <div className="glass rounded-2xl p-5 lg:col-span-5">
                <div className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Severity mix</div>
                <div className="space-y-3">
                  {[
                    ["Critical", 0, "bg-[oklch(0.7_0.24_25)]"],
                    ["High", 3, "bg-[oklch(0.83_0.18_85)]"],
                    ["Medium", 12, "bg-[oklch(0.7_0.18_200)]"],
                    ["Low", 47, "bg-neon"],
                  ].map(([l, n, c]) => (
                    <div key={l as string}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-foreground/80">{l}</span>
                        <span className="font-mono text-muted-foreground">{n as number}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                        <div className={`h-full ${c}`} style={{ width: `${Math.min(100, (n as number) * 6 + 4)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Kpi({ label, value, delta, tone = "ok" }: { label: string; value: string; delta?: string; tone?: "ok" | "warn" }) {
  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display mt-1 text-2xl font-semibold gradient-text-neon">{value}</div>
      {delta && (
        <div className={`mt-0.5 text-[11px] ${tone === "ok" ? "text-neon" : "text-[oklch(0.83_0.18_85)]"}`}>{delta}</div>
      )}
    </div>
  );
}

function Dot({ tone }: { tone: "ok" | "err" | "ai" | "info" }) {
  const map = {
    ok: "bg-neon",
    err: "bg-[oklch(0.7_0.24_25)]",
    ai: "bg-[oklch(0.78_0.16_200)]",
    info: "bg-foreground/40",
  };
  return <span className={`h-1.5 w-1.5 rounded-full ${map[tone]} shadow-[0_0_8px_currentColor]`} />;
}

function Sparkline() {
  // Two layered SVG area charts
  const w = 600, h = 140;
  const series1 = genSeries(28, 30, 80);
  const series2 = genSeries(28, 8, 36);
  const path = (s: number[]) => {
    const step = w / (s.length - 1);
    return s.map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${h - (v / 100) * h}`).join(" ");
  };
  const area = (s: number[]) => `${path(s)} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 h-40 w-full">
      <defs>
        <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.92 0.27 130)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="oklch(0.92 0.27 130)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="g2" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.7 0.18 200)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="oklch(0.7 0.18 200)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area(series1)} fill="url(#g1)" />
      <path d={path(series1)} stroke="oklch(0.92 0.27 130)" strokeWidth="2" fill="none" />
      <path d={area(series2)} fill="url(#g2)" />
      <path d={path(series2)} stroke="oklch(0.7 0.18 200)" strokeWidth="2" fill="none" />
    </svg>
  );
}

function genSeries(n: number, min: number, max: number) {
  let v = (min + max) / 2;
  return Array.from({ length: n }, () => {
    v += (Math.random() - 0.5) * 14;
    v = Math.max(min, Math.min(max, v));
    return v;
  });
}
