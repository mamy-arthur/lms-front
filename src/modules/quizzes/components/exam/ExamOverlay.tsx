'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useQuizState } from '../../hooks/useQuizState';
import { useElapsedTimer } from '../../hooks/useElapsedTimer';
import { useBeforeUnload } from '../../hooks/useBeforeUnload';
import type { Question, QuizAttempt, TraineeAnswer } from '../../types';
import { computeScore } from '../../utils/quiz-scoring';
import { ExamHeader } from './ExamHeader';
import { ExamQuestionPanel } from './ExamQuestionPanel';
import { ExamAnswerPanel } from './ExamAnswerPanel';
import { ExamFooter } from './ExamFooter';
import { ExamFinishDialog } from './ExamFinishDialog';
import { isQuestionAnswered } from '../../utils/answer-completeness';

interface ExamOverlayProps {
  questions: Question[];
  title: string;
  /** Called when the exam is submitted — passes the computed attempt */
  onSubmit: (attempt: QuizAttempt, answers: Record<string, TraineeAnswer>) => void;
  /** Candidate display name shown in the header avatar */
  candidateName?: string;
  /** Short session identifier shown in the header */
  sessionId?: string;
  className?: string;
  serverManaged?: boolean;
  initialAnswers?: Record<string, TraineeAnswer>;
  onAnswerChange?: (id: string, answer: TraineeAnswer) => void;
  canEdit?: () => boolean;
  disabled?: boolean;
  countdown?: string;
  runtimeStatus?: ReactNode;
  savedQuestionIds?: string[];
}

export function ExamOverlay({
  questions,
  title,
  onSubmit,
  candidateName,
  sessionId,
  className,
  serverManaged = false,
  initialAnswers,
  onAnswerChange,
  canEdit,
  disabled = false,
  countdown,
  runtimeStatus,
  savedQuestionIds,
}: ExamOverlayProps) {
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);

  const {
    currentIndex,
    currentQuestion,
    totalQuestions,
    isFirst,
    isLast,
    answeredCount,
    answers,
    startedAt,
    completedAt,
    setAnswer,
    toggleMultipleChoice,
    setMatchingPair,
    goNext,
    goPrev,
    submit,
  } = useQuizState(questions, { initialAnswers, onAnswerChange, canEdit });

  const { formatted: elapsedFormatted } = useElapsedTimer(!disabled);
  useBeforeUnload(!serverManaged);

  // Block Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') e.preventDefault();
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, []);

  const handleConfirmFinish = useCallback(() => {
    if (
      disabled ||
      (canEdit && !canEdit()) ||
      !questions.every((question) => isQuestionAnswered(question, answers[question.id]))
    )
      return;
    setShowFinishDialog(false);
    if (!serverManaged) submit();
    const now = completedAt ?? new Date();
    const { pointsObtained, maxPoints, grade } = computeScore(questions, answers);
    const attempt: QuizAttempt = {
      startedAt,
      completedAt: now,
      status: 'completed',
      pointsObtained,
      maxPoints,
      grade,
    };
    onSubmit(attempt, answers);
  }, [
    disabled,
    canEdit,
    serverManaged,
    submit,
    completedAt,
    questions,
    answers,
    startedAt,
    onSubmit,
  ]);

  if (!currentQuestion) return null;

  const currentAnswer: TraineeAnswer = answers[currentQuestion.id] ?? null;

  return (
    <>
      {/* Full-screen overlay */}
      <div
        className={cn(
          'fixed inset-0 z-50 flex flex-col bg-background',
          'animate-in fade-in duration-300',
          className,
        )}
        role="main"
        aria-label={`Examen : ${title}`}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <ExamHeader
          title={title}
          currentIndex={currentIndex}
          totalQuestions={totalQuestions}
          answeredCount={answeredCount}
          elapsedFormatted={elapsedFormatted}
          countdown={countdown}
          candidateName={candidateName}
          sessionId={sessionId}
        />
        {runtimeStatus}

        {/* ── Content ───────────────────────────────────────────────────── */}
        <div
          inert={disabled}
          aria-disabled={disabled}
          className="flex flex-1 overflow-y-auto px-4 py-10"
        >
          <div className="mx-auto flex w-full max-w-130 flex-col gap-8">
            <ExamQuestionPanel question={currentQuestion} />
            <ExamAnswerPanel
              disabled={disabled}
              question={currentQuestion}
              answer={currentAnswer}
              onAnswer={(ans) => setAnswer(currentQuestion.id, ans)}
              onToggleMultiple={(optId) => {
                toggleMultipleChoice(currentQuestion.id, optId);
              }}
              onMatchPair={(l, r) => {
                setMatchingPair(currentQuestion.id, l, r);
              }}
              saved={savedQuestionIds?.includes(currentQuestion.id) ?? false}
            />
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <ExamFooter
          disabled={disabled}
          isFirst={isFirst}
          isLast={isLast}
          onPrev={goPrev}
          onNext={goNext}
          onRequestFinish={() => setShowFinishDialog(true)}
          questions={questions}
          answers={answers}
          currentIndex={currentIndex}
        />
      </div>

      {/* Keep the portal inside the exam/evaluation root, including when the
          navigation guard marks surrounding application siblings inert. */}
      <div ref={setPortalContainer} data-exam-portal="" />
      <ExamFinishDialog
        open={showFinishDialog && !disabled}
        container={portalContainer}
        questions={questions}
        answers={answers}
        onCancel={() => setShowFinishDialog(false)}
        onConfirm={handleConfirmFinish}
      />
    </>
  );
}
