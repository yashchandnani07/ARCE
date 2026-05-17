import { Terminal } from "../Terminal";
import { SectionHeader } from "./Pipeline";
import { getLiveDemoStats } from "@/lib/api";
import type { Tone } from "@/data/types";

const STATS = getLiveDemoStats();

export function LiveDemo() {
  return (
    <section id="demo" className="relative py-28">
      <div className="absolute left-1/2 top-1/3 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-neon/[0.03] blur-[120px]" />
      <div className="relative mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Live Remediation"
          title={
            <>
              Watch a vulnerability die{" "}
              <span className="font-editorial italic font-normal text-neon/95">in real time.</span>
            </>
          }
          desc="No mock. No edited screencast. This is the same engine your CI calls."
        />

        <div className="mt-14 grid items-center gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Terminal />
          </div>

          <div className="lg:col-span-5 space-y-4">
            {STATS.map((s) => (
              <Stat key={s.label} {...s} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: Tone }) {
  const color =
    tone === "ok"
      ? "text-neon"
      : tone === "err"
        ? "text-[oklch(0.7_0.24_25)]"
        : tone === "ai"
          ? "text-[oklch(0.78_0.16_200)]"
          : "text-foreground";
  return (
    <div className="glass rounded-2xl p-5">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`font-display mt-1 text-3xl font-semibold ${color}`}>{value}</div>
      <div className="mt-1 font-mono text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
