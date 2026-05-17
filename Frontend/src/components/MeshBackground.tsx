import { useEffect, useRef } from "react";

/**
 * Canvas-based animated cybersecurity mesh / neural network background.
 * Uses 2D canvas instead of WebGL for sandbox compatibility (no GPU adapter).
 * Mouse-reactive, particle-connected, neon green.
 */
export function MeshBackground({ density = 60, className = "" }: { density?: number; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0, h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    type P = { x: number; y: number; vx: number; vy: number; r: number };
    let particles: P[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.floor((w * h) / (18000)) + density / 2;
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.4 + 0.4,
      }));
    };

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };
    const onLeave = () => { mouseRef.current.x = -9999; mouseRef.current.y = -9999; };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Mouse glow
      const { x: mx, y: my } = mouseRef.current;
      if (mx > -9000) {
        const grad = ctx.createRadialGradient(mx, my, 0, mx, my, 240);
        grad.addColorStop(0, "rgba(183, 255, 74, 0.05)");
        grad.addColorStop(1, "rgba(183, 255, 74, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      // Update + draw particles
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        // Mouse attraction
        if (mx > -9000) {
          const dx = mx - p.x, dy = my - p.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 24000) {
            const f = 0.0006;
            p.vx += dx * f * 0.01;
            p.vy += dy * f * 0.01;
          }
        }
        p.vx = Math.max(-0.6, Math.min(0.6, p.vx));
        p.vy = Math.max(-0.6, Math.min(0.6, p.vy));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(183, 255, 74, 0.45)";
        ctx.fill();
      }

      // Connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 14000) {
            const alpha = (1 - d2 / 14000) * 0.12;
            ctx.strokeStyle = `rgba(183, 255, 74, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, [density]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 h-full w-full ${className}`}
      style={{ pointerEvents: "none" }}
      aria-hidden
    />
  );
}
