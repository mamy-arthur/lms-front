'use client';

import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Quiz } from '@/modules/quizzes';
import { evaluationAttemptsApi } from '@/shared/api/portal.api';
import { getApiErrorMessage } from '@/shared/lib/errors';
import type { ApiEvaluationAttempt } from '@/shared/types/evaluation-attempt.types';
import type { TraineeAnswer } from '@/modules/quizzes/types';
import type { Question } from '@/modules/shared/lib/question-types';
import EvaluationSplash from './EvaluationSplash';
import EvaluationResult from './EvaluationResult';
import type { FormationEvaluation } from '../lib/types';
import { normalizeAttemptQuiz, toApiPayload } from '../lib/evaluation-attempt-utils';
import { EXECUTION_CONFLICT_MESSAGE } from '../lib/constants';
import { adoptExecutionSnapshot } from '../lib/execution-cache';
import {
  usePortalLearnerEvaluationQuery,
  useInvalidateLearnerEvaluation,
} from '../hooks/usePortalLearnerEvaluationQuery';
import { useExecutionConflictRecovery } from '../hooks/useExecutionConflictRecovery';
import type { ExecutionMutationContext } from '@/shared/types/progression.types';

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  evaluation: FormationEvaluation;
  /** Inscription consultée — porte les compteurs de tentatives. */
  enrollmentId: string;
  /** Visite et révision à transmettre au démarrage ; `null` sans visite ouverte. */
  executionContext: ExecutionMutationContext | null;
  onComplete: (score: number, passed: boolean) => void;
}

export default function EvaluationRunner({
  evaluation,
  enrollmentId,
  executionContext,
  onComplete,
}: Props) {
  const typLabel = evaluation.evaluationType === 'intermediate' ? 'Intermédiaire' : 'Finale';
  const evalDescription = `Évaluation ${typLabel} · Score requis : ${evaluation.passingScore}%`;
  const queryClient = useQueryClient();
  const recoverFromConflict = useExecutionConflictRecovery(enrollmentId);

  const {
    data: evalInfo,
    isPending: isEvalInfoPending,
    isError: isEvalInfoError,
    refetch: refetchEvalInfo,
  } = usePortalLearnerEvaluationQuery(enrollmentId, evaluation.id);
  const invalidateLearnerEvaluation = useInvalidateLearnerEvaluation();

  // Le budget appartient au round de validation figé : la ligne catalogue vivante
  // ne le décrit plus. Un round `null` signifie qu'aucune obligation n'est
  // ouverte — les compteurs d'inscription ne servent alors qu'à l'affichage.
  const round = evaluation.execution.round;
  const quota = round
    ? {
        maxAttempts: round.max_attempts,
        attemptsUsed: round.attempts_used,
        attemptsRemaining: round.remaining_attempts,
      }
    : {
        maxAttempts: evalInfo?.max_attempts,
        attemptsUsed: evalInfo?.attempts_used,
        attemptsRemaining: evalInfo?.attempts_remaining,
      };

  // Le moteur décide seul de l'ouverture du nœud : le frontend ne reconstruit pas
  // la règle, il lit `actionable`.
  const isLockedByExecution = !evaluation.execution.actionable || executionContext === null;

  // Gates the splash CTA. `isPending` (not `isLoading`) so a background refetch
  // that has no data yet also counts as "unknown" — the quota must never be
  // presented as available while it is still being resolved.
  const isCheckingAttempts = isEvalInfoPending && !isEvalInfoError;

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
    if (isCheckingAttempts || isLockedByExecution || !executionContext) return;
    // Garde contre le double clic : une seconde requête concurrente serait
    // refusée et ferait clignoter le splash entre deux états contradictoires.
    if (isStarting) return;

    setIsStarting(true);
    try {
      const res = await evaluationAttemptsApi.start(enrollmentId, evaluation.id, executionContext);
      setAttempt(res.data);
      setPhase('quiz');
    } catch (err) {
      // Un contexte refusé n'est pas un plafond atteint : le parcours a basculé
      // ailleurs. L'état est rechargé et l'apprenant redemande l'action.
      if (recoverFromConflict(err)) {
        toast.error(EXECUTION_CONFLICT_MESSAGE);
        return;
      }
      // 409 = RetakeLimitReachedException. Telling the learner to "réessayer"
      // here is wrong: no retry can ever succeed. Refresh the quota instead so
      // the splash flips to its "tentatives épuisées" state.
      if ((err as { status?: number }).status === 409) {
        invalidateLearnerEvaluation(enrollmentId);
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
      // La soumission a pu déclencher une transition : adopter sa révision évite
      // qu'une écriture lancée avant le rechargement ne soit refusée.
      adoptExecutionSnapshot(queryClient, enrollmentId, res.execution);
      const score = res.data.score ?? 0;
      setFinalScore(score);
      setPhase('result');
      onComplete(score, score >= evaluation.passingScore);
      invalidateLearnerEvaluation(enrollmentId);
    } catch (err) {
      if (recoverFromConflict(err)) {
        toast.error(EXECUTION_CONFLICT_MESSAGE);
        return;
      }
      toast.error('Erreur lors de la soumission. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (phase === 'result') {
    return (
      <EvaluationResult
        score={finalScore ?? 0}
        passingScore={evaluation.passingScore}
        maxAttempts={quota.maxAttempts}
        attemptsUsed={quota.attemptsUsed}
        attemptsRemaining={quota.attemptsRemaining}
        onRetry={
          evaluation.execution.actionable
            ? () => {
                setAttempt(null);
                setFinalScore(null);
                setPhase('splash');
              }
            : undefined
        }
      />
    );
  }

  // Un passage acquis se consulte sans réafficher les consignes de démarrage.
  // L'historique seul ne suffit pas : un nœud à refaire reste en retry/locked.
  if (evaluation.status === 'completed') {
    const score = evaluation.execution.currentScore;

    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-12 text-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-primary/10">
          <ClipboardCheck className="size-8 text-primary" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">{evaluation.title}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Évaluation terminée</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Vous avez terminé cette évaluation. Ce passage est consultable en lecture seule.
        </p>
        {score !== null && (
          <div className="mt-8 w-full rounded-2xl border bg-card p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">Votre score</p>
            <p className="mt-2 text-4xl font-bold">{score}%</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Score requis : {evaluation.passingScore}%
            </p>
          </div>
        )}
      </div>
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
      maxAttempts={quota.maxAttempts}
      attemptsUsed={quota.attemptsUsed}
      attemptsRemaining={quota.attemptsRemaining}
      isLocked={isLockedByExecution}
      lockedReason={lockedReason(evaluation)}
    />
  );
}

function lockedReason(evaluation: FormationEvaluation): string | undefined {
  const execution = evaluation.execution;
  if (!execution) return undefined;
  if (execution.round?.status === 'exhausted') {
    return 'Toutes les tentatives de ce round ont été utilisées.';
  }
  if (execution.currentVisit?.status === 'completed') {
    return 'Ce passage est terminé. Son résultat reste consultable.';
  }

  return "Cette évaluation n'est pas ouverte à ce stade de votre parcours.";
}
