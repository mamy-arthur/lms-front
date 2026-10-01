'use client';

import { useEffect, useState } from 'react';
import { useEvaluationDocument } from './useEvaluationDocument';
import { formatElapsed } from '@/modules/quizzes/hooks/useElapsedTimer';

export function useEvaluationDeadline(attemptId: string | null) {
  const document = useEvaluationDocument();
  const [, tick] = useState(0);
  useEffect(() => {
    if (!attemptId) return;
    const timer = setInterval(() => tick((value) => value + 1), 250);
    return () => clearInterval(timer);
  }, [attemptId, document]);
  const deadline = attemptId ? document?.clocks.get(attemptId)?.deadline : null;
  const remaining =
    deadline == null ? null : Math.max(0, Math.ceil((deadline - performance.now()) / 1000));
  return {
    remaining,
    formatted: remaining == null ? undefined : formatElapsed(remaining),
    expired: remaining === 0,
  };
}
