import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/sections/Hero";
import { Pipeline } from "@/components/sections/Pipeline";
import { Features } from "@/components/sections/Features";
import { LiveDemo } from "@/components/sections/LiveDemo";
import { DashboardPreview } from "@/components/sections/DashboardPreview";
import { Ecosystem } from "@/components/sections/Ecosystem";
import { Governance } from "@/components/sections/Governance";
import { FinalCTA } from "@/components/sections/FinalCTA";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ARCE — Autonomous Remediation & Compliance Engine" },
      {
        name: "description",
        content:
          "ARCE detects, patches, self-corrects, and governs vulnerabilities across your repositories — autonomously. The AI security engine for modern DevSecOps teams.",
      },
      { property: "og:title", content: "ARCE — Autonomous AI Security Remediation" },
      {
        property: "og:description",
        content: "Detect. Patch. Self-Correct. Govern. The AI engine that turns CVE backlog into governed PRs.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased">
      <Nav />
      <main className="relative">
        <Hero />
        <Divider />
        <Pipeline />
        <Divider />
        <Features />
        <Divider />
        <LiveDemo />
        <Divider />
        <DashboardPreview />
        <Divider />
        <Ecosystem />
        <Divider />
        <Governance />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

function Divider() {
  return (
    <div className="relative mx-auto max-w-7xl px-6">
      <div className="divider-glow" />
    </div>
  );
}
