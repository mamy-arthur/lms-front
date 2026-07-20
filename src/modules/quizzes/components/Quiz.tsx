'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { Question, QuizAttempt, TraineeAnswer } from '../types';
import { ExamOverlay } from './exam/ExamOverlay';
import { QuizSummary } from './QuizSummary';

interface QuizProps {
  questions: Question[];
  title?: string;
  description?: string;
  className?: string;
  /** Candidate display name shown in the exam header */
  candidateName?: string;
  /** Short session identifier shown in the exam header */
  sessionId?: string;
  /** Called when the candidate clicks "Recommencer" — returns to the start screen if provided */
  onReset?: () => void;
}

type Phase = 'exam' | 'summary';

export function Quiz({
  questions,
  title = 'Quiz',
  className,
  candidateName,
  sessionId,
  onReset,
}: QuizProps) {
  const [phase, setPhase] = useState<Phase>('exam');
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [finalAnswers, setFinalAnswers] = useState<Record<string, TraineeAnswer>>({});

  if (questions.length === 0) {
    return (
      <div className={cn('flex flex-col items-center gap-4 py-16 text-center', className)}>
        <p className="text-muted-foreground">Aucune question disponible pour ce quiz.</p>
      </div>
    );
  }

  if (phase === 'summary' && attempt) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background animate-in fade-in duration-300">
        <QuizSummary
          questions={questions}
          answers={finalAnswers}
          attempt={attempt}
          onRetry={() => {
            setPhase('exam');
            setAttempt(null);
            setFinalAnswers({});
            onReset?.();
          }}
        />
      </div>
    );
  }

  return (
    <ExamOverlay
      questions={questions}
      title={title}
      candidateName={candidateName}
      sessionId={sessionId}
      onSubmit={(completedAttempt, answers) => {
        setAttempt(completedAttempt);
        setFinalAnswers(answers);
        setPhase('summary');
      }}
    />
  );
}
