'use client';

import { useEffect, useRef, useState } from 'react';

/** Returns elapsed seconds since the hook was first mounted. Increments every second. */
export function useElapsedTimer(running = true) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(performance.now());

  useEffect(() => {
    if (!running) return;
    startRef.current = performance.now() - elapsed * 1000;
    const id = setInterval(() => {
      setElapsed(Math.floor((performance.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const formatted = formatElapsed(elapsed);
  return { elapsed, formatted };
}

export function formatElapsed(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}
