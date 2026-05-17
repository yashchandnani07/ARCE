import { createFileRoute, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Nav";
import { KPIS, OPEN_PR, REASONING_TRACE, REPOSITORIES } from "@/data/mock";
import { getActivityFeed, subscribeActivityStream } from "@/lib/api";
import type { ActivityEvent, Repository, Tone } from "@/data/types";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Console — ARCE" },
      { name: "description", content: "Live remediation console for the ARCE engine." },
    ],
  }),
  component: Dashboard,
});

const NAV = [
  { label: "Overview", icon: "◉", href: "/dashboard" },
  { label: "Repositories", icon: "▤", href: "#repos" },
  { label: "Vulnerabilities", icon: "⚠", href: "#vulns" },
  { label: "Live Runs", icon: "▶", href: "#runs" },
  { label: "AI Reasoning", icon: "✶", href: "#ai" },
  { label: "Audit", icon: "❖", href: "#audit" },
  { label: "Pull Requests", icon: "⌥", href: "#prs" },
  { label: "Settings", icon: "⚙", href: "#settings" },
];

function Dashboard() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1">
        <TopBar />
        <main className="mx-auto max-w-[1400px] px-6 py-6 space-y-6">
          <KPIs />
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-6">
              <ActivityChart />
              <RepoTable />
            </div>
            <div className="lg:col-span-4 space-y-6">
              <ActivityFeed />
              <ReasoningLog />
            </div>
          </div>
          <PRReview />
        </main>
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-white/5 bg-sidebar/60 backdrop-blur-xl md:flex">
      <div className="flex items-center gap-2.5 border-b border-white/5 px-5 py-4">
        <Logo />
        <div className="leading-tight">
          <div className="font-display text-sm font-semibold">ARCE</div>
          <div className="font-mono text-[10px] text-muted-foreground">acme · prod</div>
        </div>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {NAV.map((item, i) => (
          <a
            key={item.label}
            href={item.href}
            className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
              i === 0
                ? "bg-neon/10 text-neon ring-1 ring-neon/20"
                : "text-foreground/70 hover:bg-white/5 hover:text-foreground"
            }`}
          >
            <span className="w-4 text-center text-base">{item.icon}</span>
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
      <div className="border-t border-white/5 p-4">
        <div className="glass rounded-xl p-3">
          <div className="font-mono text-[10px] text-neon">● operating</div>
          <div className="mt-1 text-xs text-foreground/80">All engines healthy</div>
          <div className="mt-1 font-mono text-[10px] text-muted-foreground">last sync · 4s ago</div>
        </div>
        <Link to="/" className="mt-3 block text-center text-xs text-muted-foreground transition hover:text-neon">
          ← Back to site
        </Link>
      </div>
    </aside>
  );
}

function TopBar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <header className="sticky top-0 z-40 flex items-center gap-4 border-b border-white/5 bg-background/70 px-6 py-3 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Console</span>
        <span className="text-muted-foreground/50">/</span>
        <span className="font-medium">{path === "/dashboard" ? "Overview" : path}</span>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 md:flex">
          <span className="text-muted-foreground text-xs">⌘K</span>
          <span className="text-xs text-foreground/70">Search repos, CVEs, PRs…</span>
        </div>
        <span className="chip">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-neon" />
          </span>
          live
        </span>
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-neon to-[oklch(0.7_0.18_200)] ring-2 ring-background" />
      </div>
    </header>
  );
}

function KPIs() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {KPIS.map((i) => (
        <div key={i.label} className="glass rounded-2xl p-5">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{i.label}</div>
          <div className="mt-1 flex items-end justify-between">
            <div className="font-display text-3xl font-semibold gradient-text-neon">{i.value}</div>
            <Spark data={i.spark} />
          </div>
          <div className="mt-1 text-[11px] text-neon">{i.delta} · 7d</div>
        </div>
      ))}
    </div>
  );
}

function Spark({ data }: { data: number[] }) {
  const w = 80, h = 28;
  const max = Math.max(...data), min = Math.min(...data);
  const norm = (v: number) => h - ((v - min) / Math.max(0.0001, max - min)) * h;
  const step = w / (data.length - 1);
  const path = data.map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${norm(v)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-7 w-20">
      <path d={path} fill="none" stroke="oklch(0.92 0.27 130)" strokeWidth="1.5" />
    </svg>
  );
}

function ActivityChart() {
  return (
    <div className="glass-strong rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Remediation throughput</div>
          <div className="font-display mt-1 text-lg">Last 30 days</div>
        </div>
        <div className="flex gap-2 text-[11px] text-muted-foreground">
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-neon" />Auto</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[oklch(0.7_0.18_200)]" />AI corrected</span>
          <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-[oklch(0.83_0.18_85)]" />Reviewed</span>
        </div>
      </div>
      <BarChart />
    </div>
  );
}

function BarChart() {
  const days = 30;
  const data = Array.from({ length: days }, () => ({
    a: 6 + Math.random() * 14,
    b: 2 + Math.random() * 6,
    c: 1 + Math.random() * 3,
  }));
  return (
    <div className="mt-5 flex h-48 items-end gap-1">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col-reverse gap-[2px]">
          <div className="rounded-sm bg-neon" style={{ height: `${(d.a / 24) * 100}%`, boxShadow: "0 0 6px oklch(0.92 0.27 130 / 0.4)" }} />
          <div className="rounded-sm bg-[oklch(0.7_0.18_200)]" style={{ height: `${(d.b / 24) * 100}%` }} />
          <div className="rounded-sm bg-[oklch(0.83_0.18_85)]" style={{ height: `${(d.c / 24) * 100}%` }} />
        </div>
      ))}
    </div>
  );
}

function RepoTable() {
  return (
    <div className="glass-strong overflow-hidden rounded-2xl">
      <div className="flex items-center gap-3 border-b border-white/5 px-5 py-3">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Repositories</div>
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">
          {REPOSITORIES.length} of 1,283
        </span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-widest text-muted-foreground">
            <th className="px-5 py-2 text-left font-medium">Repository</th>
            <th className="px-5 py-2 text-left font-medium">Score</th>
            <th className="px-5 py-2 text-left font-medium">C / H / M</th>
            <th className="px-5 py-2 text-left font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {REPOSITORIES.map((r: Repository) => (
            <tr key={r.name} className="border-t border-white/5 hover:bg-white/[0.02]">
              <td className="px-5 py-3 font-mono text-foreground/90">{r.name}</td>
              <td className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-neon" style={{ width: `${r.score}%` }} />
                  </div>
                  <span className="font-mono text-xs">{r.score}</span>
                </div>
              </td>
              <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{r.severityMix}</td>
              <td className="px-5 py-3">
                <StatusPill tone={r.tone}>{r.status}</StatusPill>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusPill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const map: Record<Tone, string> = {
    ok: "text-neon bg-neon/10 ring-neon/30",
    err: "text-[oklch(0.7_0.24_25)] bg-[oklch(0.7_0.24_25)]/10 ring-[oklch(0.7_0.24_25)]/30",
    ai: "text-[oklch(0.78_0.16_200)] bg-[oklch(0.78_0.16_200)]/10 ring-[oklch(0.78_0.16_200)]/30",
    info: "text-foreground/70 bg-white/5 ring-white/10",
    warn: "text-[oklch(0.83_0.18_85)] bg-[oklch(0.83_0.18_85)]/10 ring-[oklch(0.83_0.18_85)]/30",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${map[tone]}`}>
      <span className="h-1 w-1 rounded-full bg-current" />
      {children}
    </span>
  );
}

function ActivityFeed() {
  const [items, setItems] = useState<ActivityEvent[]>([]);

  useEffect(() => {
    let cancelled = false;
    getActivityFeed().then((feed) => {
      if (!cancelled) setItems(feed);
    });
    const unsubscribe = subscribeActivityStream((event) => {
      setItems((cur) => [event, ...cur].slice(0, 8));
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Live activity</div>
        <span className="font-mono text-[10px] text-neon">● streaming</span>
      </div>
      <ul className="mt-3 space-y-2.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span
              className={`mt-1.5 h-1.5 w-1.5 rounded-full shadow-[0_0_8px_currentColor] ${
                it.tone === "ok" ? "bg-neon text-neon"
                : it.tone === "err" ? "bg-[oklch(0.7_0.24_25)] text-[oklch(0.7_0.24_25)]"
                : it.tone === "ai" ? "bg-[oklch(0.78_0.16_200)] text-[oklch(0.78_0.16_200)]"
                : "bg-foreground/40 text-foreground/40"
              }`}
            />
            <span className="flex-1 text-foreground/85">{it.text}</span>
            <span className="font-mono text-[10px] text-muted-foreground">{it.ago}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReasoningLog() {
  const toneClass: Record<Tone, string> = {
    ai: "text-[oklch(0.78_0.16_200)]",
    err: "text-[oklch(0.7_0.24_25)]",
    ok: "text-neon",
    info: "text-foreground/70",
    warn: "text-[oklch(0.83_0.18_85)]",
  };
  return (
    <div className="glass-strong overflow-hidden rounded-2xl">
      <div className="flex items-center gap-2 border-b border-white/5 px-5 py-3">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">AI reasoning trace</div>
        <span className="ml-auto chip !text-[10px]">PR #{OPEN_PR.number}</span>
      </div>
      <div className="font-mono text-[12px] leading-6 px-5 py-4 space-y-1">
        {REASONING_TRACE.map((line, i) => (
          <p key={i} className={toneClass[line.tone]}>
            {line.tag} {line.text}
          </p>
        ))}
      </div>
    </div>
  );
}

function PRReview() {
  const pr = OPEN_PR;
  return (
    <div className="glass-strong overflow-hidden rounded-2xl">
      <div className="flex items-center gap-3 border-b border-white/5 px-5 py-3">
        <span className="chip !text-[10px]">PR · open</span>
        <div className="font-mono text-xs text-muted-foreground">
          {pr.repo} · #{pr.number}
        </div>
        <button className="ml-auto btn-neon !py-1.5 !px-3 !text-[12px]">Approve & merge</button>
      </div>
      <div className="grid gap-0 lg:grid-cols-2">
        <div className="border-r border-white/5 p-5">
          <h4 className="font-display text-base font-semibold">{pr.title}</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Opened by <span className="text-neon">{pr.author}</span> · {pr.filesChanged} files · +
            {pr.additions} −{pr.deletions}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              [pr.testsPassed, "Tests"],
              [String(pr.regressions), "Regressions"],
              [pr.risk, "Risk"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-lg bg-white/[0.02] p-2 ring-1 ring-white/5">
                <div className="font-display text-base text-neon">{v}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-5">
          <div className="font-mono text-[12px] space-y-1">
            {pr.diff[0]?.path && (
              <div className="text-muted-foreground">{pr.diff[0].path}</div>
            )}
            {pr.diff.map((d, i) => (
              <div
                key={i}
                className={`rounded px-2 py-1 ${
                  d.sign === "+"
                    ? "text-neon bg-neon/[0.06]"
                    : "text-[oklch(0.7_0.24_25)] bg-[oklch(0.7_0.24_25)]/[0.06]"
                }`}
              >
                <span className="opacity-60 mr-2">{d.sign}</span>
                {d.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
