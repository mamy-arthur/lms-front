'use client';

import { useEffect, useSyncExternalStore } from 'react';
import type { EvaluationAutosave } from '../lib/evaluation-autosave';
import type { AutosaveSnapshot } from '../lib/evaluation-autosave';

const EMPTY: AutosaveSnapshot = { pending: false, failed: false, savedIds: [], completed: null };
const emptySnapshot = () => EMPTY;
const emptySubscribe = () => () => {};

export function useEvaluationAutosave(saves: EvaluationAutosave | null, enabled = true) {
  const snapshot = useSyncExternalStore(
    saves?.subscribe ?? emptySubscribe,
    saves?.getSnapshot ?? emptySnapshot,
    emptySnapshot,
  );
  useEffect(() => {
    if (!saves || !enabled) return;
    const timer = setInterval(saves.retry, 3000);
    window.addEventListener('online', saves.retry);
    return () => {
      clearInterval(timer);
      window.removeEventListener('online', saves.retry);
    };
  }, [saves, enabled]);
  return snapshot;
}
