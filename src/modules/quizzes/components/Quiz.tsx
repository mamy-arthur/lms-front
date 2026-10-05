'use client';

import { useState, type ReactNode } from 'react';
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
  /** Optional external handler called on exam submission before showing the summary */
  onSubmit?: (attempt: QuizAttempt, answers: Record<string, TraineeAnswer>) => void;
  /** Server-owned evaluations must never show locally computed results. */
  serverManaged?: boolean;
  initialAnswers?: Record<string, TraineeAnswer>;
  onAnswerChange?: (id: string, answer: TraineeAnswer) => void;
  canEdit?: () => boolean;
  disabled?: boolean;
  countdown?: string;
  runtimeStatus?: ReactNode;
  savedQuestionIds?: string[];
}

type Phase = 'exam' | 'summary';

export function Quiz({
  questions,
  title = 'Quiz',
  className,
  candidateName,
  sessionId,
  onReset,
  onSubmit,
  serverManaged,
  initialAnswers,
  onAnswerChange,
  canEdit,
  disabled,
  countdown,
  runtimeStatus,
  savedQuestionIds,
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
      serverManaged={serverManaged}
      initialAnswers={initialAnswers}
      onAnswerChange={onAnswerChange}
      canEdit={canEdit}
      disabled={disabled}
      countdown={countdown}
      runtimeStatus={runtimeStatus}
      savedQuestionIds={savedQuestionIds}
      onSubmit={(completedAttempt, answers) => {
        if (serverManaged) {
          onSubmit?.(completedAttempt, answers);
          return;
        }
        setAttempt(completedAttempt);
        setFinalAnswers(answers);
        setPhase('summary');
        onSubmit?.(completedAttempt, answers);
      }}
    />
  );
}
