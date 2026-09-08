'use client';

import { useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Quiz } from '@/modules/quizzes';
import { normalizeQuestion } from '@/modules/shared/lib/question-types';
import { evaluationAttemptsApi } from '@/shared/api/portal.api';
import { getApiErrorMessage } from '@/shared/lib/errors';
import type { ApiEvaluationAttempt } from '@/shared/types/evaluation-attempt.types';
import type { TraineeAnswer } from '@/modules/quizzes/types';
import type { Question } from '@/modules/shared/lib/question-types';
import EvaluationSplash from './EvaluationSplash';
import EvaluationResult from './EvaluationResult';
import type { FormationEvaluation } from '../lib/types';
import { makeSessionId, normalizeAttemptQuiz, toApiPayload } from '../lib/evaluation-attempt-utils';
import {
  usePortalLearnerEvaluationQuery,
  useInvalidateLearnerEvaluation,
} from '../hooks/usePortalLearnerEvaluationQuery';

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  evaluation: FormationEvaluation;
  onComplete: (score: number, passed: boolean) => void;
}

export default function EvaluationRunner({ evaluation, onComplete }: Props) {
  const isRealMode = evaluation.questions.length === 0;
  const typLabel = evaluation.evaluationType === 'intermediate' ? 'Intermédiaire' : 'Finale';
  const evalDescription = `Évaluation ${typLabel} · Score requis : ${evaluation.passingScore}%`;

  const {
    data: evalInfo,
    isPending: isEvalInfoPending,
    isError: isEvalInfoError,
    refetch: refetchEvalInfo,
  } = usePortalLearnerEvaluationQuery(
    isRealMode ? evaluation.formationId : undefined,
    evaluation.id,
  );
  const invalidateLearnerEvaluation = useInvalidateLearnerEvaluation();

  // Gates the splash CTA. `isPending` (not `isLoading`) so a background refetch
  // that has no data yet also counts as "unknown" — the quota must never be
  // presented as available while it is still being resolved.
  const isCheckingAttempts = isRealMode && isEvalInfoPending && !isEvalInfoError;

  // ── Mock mode state ──────────────────────────────────────────────────────
  const [mockStarted, setMockStarted] = useState(false);
  const sessionIdRef = useRef(makeSessionId());

  const mockQuestions = useMemo(
    () => evaluation.questions.map(normalizeQuestion),
    [evaluation.questions],
  );

  // ── Real mode state ──────────────────────────────────────────────────────
  const [attempt, setAttempt] = useState<ApiEvaluationAttempt | null>(null);
  const [phase, setPhase] = useState<'splash' | 'quiz' | 'result'>('splash');
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  const apiQuestions = useMemo<Question[]>(
    () => (attempt ? attempt.quizzes.map(normalizeAttemptQuiz) : []),
    [attempt],
  );

  async function handleRealStart() {
    // Defensive: the splash hides the CTA while the quota is unknown, but a stale
    // render or a keyboard activation must not slip a start request through.
    if (isCheckingAttempts) return;

    setIsStarting(true);
    try {
      // evaluation.formationId is set to the learning path id in summary-mapper
      const res = await evaluationAttemptsApi.start(evaluation.formationId, evaluation.id);
      setAttempt(res.data);
      setPhase('quiz');
    } catch (err) {
      // 409 = RetakeLimitReachedException. Telling the learner to "réessayer"
      // here is wrong: no retry can ever succeed. Refresh the quota instead so
      // the splash flips to its "tentatives épuisées" state.
      if ((err as { status?: number }).status === 409) {
        invalidateLearnerEvaluation(evaluation.formationId);
        toast.error("Vous n'avez plus de tentative disponible pour cette évaluation.");
      } else {
        toast.error(
          getApiErrorMessage(err, "Impossible de démarrer l'évaluation. Veuillez réessayer."),
        );
      }
    } finally {
      setIsStarting(false);
    }
  }

  async function handleRealSubmit(_: unknown, answers: Record<string, TraineeAnswer>) {
    if (!attempt) return;
    setIsSubmitting(true);
    try {
      await Promise.all(
        Object.entries(answers).map(([attemptQuizId, answer]) => {
          const quiz = attempt.quizzes.find((q) => q.id === attemptQuizId);
          if (!quiz || answer === null || answer === undefined) return Promise.resolve();
          return evaluationAttemptsApi.answer(
            attempt.id,
            attemptQuizId,
            toApiPayload(quiz, answer),
          );
        }),
      );
      // Finalize
      const res = await evaluationAttemptsApi.submit(attempt.id);
      const score = res.data.score ?? 0;
      setFinalScore(score);
      setPhase('result');
      onComplete(score, score >= evaluation.passingScore);
      invalidateLearnerEvaluation(evaluation.formationId);
    } catch {
      toast.error('Erreur lors de la soumission. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Mock mode render ─────────────────────────────────────────────────────

  if (!isRealMode) {
    if (mockStarted) {
      return (
        <Quiz
          key="quiz-session"
          questions={mockQuestions}
          title={evaluation.title}
          description={evalDescription}
          sessionId={sessionIdRef.current}
          onReset={() => setMockStarted(false)}
        />
      );
    }
    return (
      <EvaluationSplash
        title={evaluation.title}
        evaluationType={evaluation.evaluationType}
        onStart={() => setMockStarted(true)}
      />
    );
  }

  // ── Real mode render ─────────────────────────────────────────────────────

  if (phase === 'result') {
    return (
      <EvaluationResult
        score={finalScore ?? 0}
        passingScore={evaluation.passingScore}
        maxAttempts={evalInfo?.max_attempts}
        attemptsUsed={evalInfo?.attempts_used}
        attemptsRemaining={evalInfo?.attempts_remaining}
        onRetry={() => {
          setAttempt(null);
          setFinalScore(null);
          setPhase('splash');
        }}
      />
    );
  }

  if (phase === 'quiz' && attempt) {
    if (isSubmitting) {
      return (
        <div className="flex flex-col items-center gap-3 py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Envoi de vos réponses…</p>
        </div>
      );
    }
    return (
      <Quiz
        key={attempt.id}
        questions={apiQuestions}
        title={evaluation.title}
        description={evalDescription}
        sessionId={attempt.id}
        onSubmit={handleRealSubmit}
      />
    );
  }

  // splash
  return (
    <EvaluationSplash
      title={evaluation.title}
      evaluationType={evaluation.evaluationType}
      onStart={handleRealStart}
      isLoading={isStarting}
      isCheckingAttempts={isCheckingAttempts}
      hasAttemptsError={isEvalInfoError}
      onRetryAttempts={() => void refetchEvalInfo()}
      maxAttempts={evalInfo?.max_attempts}
      attemptsUsed={evalInfo?.attempts_used}
      attemptsRemaining={evalInfo?.attempts_remaining}
    />
  );
}
