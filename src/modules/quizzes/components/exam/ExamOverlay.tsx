'use client';

import { useCallback, useEffect, useState } from 'react';
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
}

export function ExamOverlay({
  questions,
  title,
  onSubmit,
  candidateName,
  sessionId,
  className,
}: ExamOverlayProps) {
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [savedQuestionId, setSavedQuestionId] = useState<string | null>(null);

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
  } = useQuizState(questions);

  const { formatted: elapsedFormatted } = useElapsedTimer(true);
  useBeforeUnload(true);

  // Block Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') e.preventDefault();
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, []);

  // Autosave feedback
  const handleAnswer = useCallback(
    (questionId: string, answer: TraineeAnswer) => {
      setAnswer(questionId, answer);
      setSavedQuestionId(questionId);
      const timer = setTimeout(() => setSavedQuestionId(null), 1500);
      return () => clearTimeout(timer);
    },
    [setAnswer],
  );

  const handleConfirmFinish = useCallback(() => {
    submit();
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
  }, [submit, completedAt, questions, answers, startedAt, onSubmit]);

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
          candidateName={candidateName}
          sessionId={sessionId}
        />

        {/* ── Content ───────────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-y-auto px-4 py-10">
          <div className="mx-auto flex w-full max-w-[520px] flex-col gap-8">
            <ExamQuestionPanel question={currentQuestion} />
            <ExamAnswerPanel
              question={currentQuestion}
              answer={currentAnswer}
              onAnswer={(ans) => handleAnswer(currentQuestion.id, ans)}
              onToggleMultiple={(optId) => {
                toggleMultipleChoice(currentQuestion.id, optId);
                setSavedQuestionId(currentQuestion.id);
                setTimeout(() => setSavedQuestionId(null), 1500);
              }}
              onMatchPair={(l, r) => {
                setMatchingPair(currentQuestion.id, l, r);
                setSavedQuestionId(currentQuestion.id);
                setTimeout(() => setSavedQuestionId(null), 1500);
              }}
              saved={savedQuestionId === currentQuestion.id}
            />
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <ExamFooter
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

      {/* Finish confirmation dialog */}
      <ExamFinishDialog
        open={showFinishDialog}
        questions={questions}
        answers={answers}
        onCancel={() => setShowFinishDialog(false)}
        onConfirm={handleConfirmFinish}
      />
    </>
  );
}
