import { motion } from "framer-motion";
import { SectionHeader } from "./Pipeline";
import { getFeatures } from "@/lib/api";

const FEATURES = getFeatures();

export function Features() {
  return (
    <section id="platform" className="relative py-28">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader
          eyebrow="Platform"
          title={
            <>
              Eight capabilities,{" "}
              <span className="font-editorial italic font-normal text-neon/95">
                one autonomous loop.
              </span>
            </>
          }
          desc="ARCE replaces the patch-test-rollback cycle with a closed-loop remediation pipeline you can audit, govern, and trust."
        />

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: (i % 4) * 0.06 }}
              className="group relative overflow-hidden rounded-2xl glass p-6 transition hover:border-neon/40"
            >
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-neon/0 blur-3xl transition group-hover:bg-neon/10" />
              <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-neon/10 text-base text-neon ring-1 ring-neon/30">
                {f.icon}
              </div>
              <h3 className="font-display mt-4 text-[17px] font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
