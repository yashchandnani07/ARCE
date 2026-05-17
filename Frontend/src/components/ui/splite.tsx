'use client';

import { Suspense, lazy, useEffect, useRef, useState } from 'react';

const Spline = lazy(() => import('@splinetool/react-spline'));

interface SplineSceneProps {
  scene: string;
  className?: string;
}

/**
 * Lightweight Spline loader:
 * - Skips entirely on mobile, low-memory devices, slow networks, or prefers-reduced-motion
 * - Defers mount until the container is in view AND the browser is idle
 */
export function SplineScene({ scene, className }: SplineSceneProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Bail out on constrained environments
    const isSmall = window.matchMedia('(max-width: 1024px)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nav = navigator as Navigator & {
      deviceMemory?: number;
      connection?: { saveData?: boolean; effectiveType?: string };
    };
    const lowMem = (nav.deviceMemory ?? 8) < 4;
    const saveData = nav.connection?.saveData === true;
    const slowNet = ['slow-2g', '2g', '3g'].includes(nav.connection?.effectiveType ?? '');

    if (isSmall || reduced || lowMem || saveData || slowNet) return;

    const el = ref.current;
    if (!el) return;

    let idleHandle = 0;
    const ric: typeof window.requestIdleCallback =
      window.requestIdleCallback || ((cb) => window.setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 0 } as IdleDeadline), 1) as unknown as number);

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          idleHandle = ric(() => setShouldRender(true), { timeout: 1500 });
          io.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    io.observe(el);

    return () => {
      io.disconnect();
      if (idleHandle && window.cancelIdleCallback) window.cancelIdleCallback(idleHandle);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {shouldRender ? (
        <Suspense fallback={null}>
          <Spline scene={scene} className={className} />
        </Suspense>
      ) : null}
    </div>
  );
}
