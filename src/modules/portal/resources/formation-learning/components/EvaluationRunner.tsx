'use client';

import { useMemo, useRef, useState } from 'react';
import { Quiz } from '@/modules/quizzes';
import { normalizeQuestion } from '@/modules/shared/lib/normalizers';
import EvaluationSplash from './EvaluationSplash';
import type { FormationEvaluation } from '../lib/types';

function makeSessionId() {
  return 'EV-' + Math.random().toString(16).slice(2, 6).toUpperCase() + '-2026';
}

interface Props {
  evaluation: FormationEvaluation;
  onComplete: (score: number, passed: boolean) => void;
}

export default function EvaluationRunner({ evaluation }: Props) {
  const [started, setStarted] = useState(false);
  const sessionIdRef = useRef(makeSessionId());

  const questions = useMemo(
    () => evaluation.questions.map(normalizeQuestion),
    [evaluation.questions],
  );

  const stats = useMemo(() => {
    const types = questions.reduce<Record<string, number>>((acc, q) => {
      acc[q.type] = (acc[q.type] ?? 0) + 1;
      return acc;
    }, {});
    const hasDuration = questions.filter((q) => q.duration !== null).length;
    return { types, hasDuration };
  }, [questions]);

  if (started) {
    const typLabel = evaluation.evaluationType === 'intermediate' ? 'Intermédiaire' : 'Finale';
    return (
      <Quiz
        key="quiz-session"
        questions={questions}
        title={evaluation.title}
        description={`Évaluation ${typLabel} · Score requis : ${evaluation.passingScore}%`}
        sessionId={sessionIdRef.current}
        onReset={() => setStarted(false)}
      />
    );
  }

  return (
    <EvaluationSplash
      title={evaluation.title}
      evaluationType={evaluation.evaluationType}
      passingScore={evaluation.passingScore}
      questionCount={questions.length}
      withTimerCount={stats.hasDuration}
      typeCount={Object.keys(stats.types).length}
      onStart={() => setStarted(true)}
    />
  );
}
