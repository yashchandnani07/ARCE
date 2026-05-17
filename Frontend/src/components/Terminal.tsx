import { useEffect, useRef, useState } from "react";
import { getTerminalScript } from "@/lib/api";
import type { TerminalLine, TerminalLineKind } from "@/data/types";

const PALETTE: Record<NonNullable<TerminalLineKind>, string> = {
  info: "text-foreground/80",
  warn: "text-[oklch(0.83_0.18_85)]",
  err: "text-[oklch(0.7_0.24_25)]",
  ok: "text-neon",
  ai: "text-[oklch(0.78_0.16_200)]",
  dim: "text-muted-foreground",
  cmd: "text-foreground",
};

const SCRIPT = getTerminalScript();

interface TerminalProps {
  loop?: boolean;
  className?: string;
}

export function Terminal({ loop = true, className = "" }: TerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const idxRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const tick = () => {
      if (!mountedRef.current) return;
      const i = idxRef.current;

      if (i >= SCRIPT.length) {
        if (loop) {
          setTimeout(() => {
            if (!mountedRef.current) return;
            idxRef.current = 0;
            setLines([]);
            tick();
          }, 1800);
        }
        return;
      }

      const line = SCRIPT[i];
      setLines((prev) => [...prev, line]);
      idxRef.current = i + 1;
      setTimeout(tick, line.delay ?? 500);
    };

    const t = setTimeout(tick, 400);
    return () => {
      mountedRef.current = false;
      clearTimeout(t);
    };
  }, [loop]);

  return (
    <div className={`relative overflow-hidden rounded-2xl glass-strong ${className}`}>
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.7_0.24_25)]/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.83_0.18_85)]/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-neon/80" />
        <span className="ml-3 font-mono text-xs text-muted-foreground">
          bob@arce ~ compliance-remediator
        </span>
        <span className="ml-auto chip">Live</span>
      </div>

      <div className="font-mono text-[12.5px] leading-6 px-5 py-4 h-[380px] overflow-hidden relative scanline">
        <div className="space-y-0.5">
          {lines.map((l, i) => (
            <div
              key={i}
              className={`${PALETTE[l.kind ?? "info"]} whitespace-pre-wrap break-words`}
            >
              {l.text}
              {i === lines.length - 1 && <span className="blink text-neon"> ▋</span>}
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-background/80 to-transparent" />
      </div>
    </div>
  );
}
