import { motion } from "framer-motion";
import { getPipelineSteps } from "@/lib/api";

const STEPS = getPipelineSteps();

export function Pipeline() {
  return (
    <section id="pipeline" className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="The ARCE Pipeline"
          title={
            <>
              From CVE alert to governed PR
              <br />
              <span className="font-editorial italic font-normal text-neon/95">
                in one continuous loop.
              </span>
            </>
          }
          desc="Eight stages, fully autonomous, fully auditable. Every decision is recorded, every test re-run, every patch reviewed by AI before a human ever sees it."
        />

        <div className="relative mt-16">
          <div className="pointer-events-none absolute left-[26px] top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-neon/40 to-transparent md:left-1/2 md:-translate-x-1/2" />

          <ol className="space-y-6">
            {STEPS.map((s, i) => (
              <motion.li
                key={s.code}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, delay: i * 0.04 }}
                className={`relative grid items-center gap-4 md:grid-cols-2 ${
                  i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div className={`flex md:justify-${i % 2 === 1 ? "start" : "end"}`}>
                  <div className="glass-strong group relative w-full max-w-md rounded-2xl p-5 transition hover:-translate-y-0.5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-neon">{s.code}</span>
                      <span className="h-px flex-1 bg-white/10" />
                    </div>
                    <h3 className="mt-2 font-display text-xl font-semibold">{s.title}</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">{s.description}</p>
                  </div>
                </div>

                <div className="absolute left-[14px] top-7 flex h-7 w-7 items-center justify-center md:left-1/2 md:-translate-x-1/2">
                  <span className="absolute h-7 w-7 rounded-full bg-neon/15 pulse-ring" />
                  <span className="relative h-2.5 w-2.5 rounded-full bg-neon shadow-[0_0_12px_var(--neon)]" />
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: React.ReactNode;
  desc?: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="rule-label justify-center">
        <span>{eyebrow}</span>
      </div>
      <h2 className="font-display mt-5 text-4xl font-medium tracking-[-0.03em] md:text-[3.25rem] md:leading-[1.04] gradient-text">
        {title}
      </h2>
      {desc && (
        <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-muted-foreground md:text-base">
          {desc}
        </p>
      )}
    </div>
  );
}
