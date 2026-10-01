'use client';

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Quiz } from '@/modules/quizzes';
import type { Question } from '@/modules/shared/lib/question-types';
import { Button } from '@/components/ui/button';
import type { EvaluationCompletionReason } from '@/shared/types/evaluation-attempt.types';
import EvaluationSplash from './EvaluationSplash';
import EvaluationResult from './EvaluationResult';
import type { Formation, FormationEvaluation } from '../lib/types';
import { portalLearningPathKeys } from '@/shared/queries/keys';
import { normalizeAttemptQuiz } from '../lib/evaluation-attempt-utils';
import { evaluationDocument, evaluationExpired } from '../lib/evaluation-document-session';
import { useEvaluationLifecycle } from '../hooks/useEvaluationLifecycle';
import { useEvaluationDocument } from '../hooks/useEvaluationDocument';
import { useEvaluationNavigationGuard } from '../hooks/useEvaluationNavigationGuard';
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
  onComplete: (score: number, passed: boolean, reason?: EvaluationCompletionReason | null) => void;
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
  // These optional fields also support pre-deadline cached summaries. The
  // server attempt, not this display-only configuration, owns the running clock.
  const configuredLimit = evaluation.timeLimitMinutes;
  const catalogueLimit = evalInfo?.time_limit_minutes;

  const root = useRef<HTMLDivElement>(null);
  const document = useEvaluationDocument();
  const resultScope = JSON.stringify([document?.id, enrollmentId, evaluation.id]);
  // Presentation only: never retain an attempt, answers or clock across visits.
  // The lifecycle must still resolve the new visit, without starting it.
  const [storedResult, setResult] = useState<{
    scope: string;
    nodeExecutionId: string | null;
    score: number;
    passingScore: number;
    reason: EvaluationCompletionReason | null;
  } | null>(null);
  const result = storedResult?.scope === resultScope ? storedResult : null;
  useLayoutEffect(() => {
    setResult((previous) => (previous?.scope === resultScope ? previous : null));
  }, [resultScope]);

  const handleExecutionError = (error: unknown) => {
    if (recoverFromConflict(error)) toast.error(EXECUTION_CONFLICT_MESSAGE);
    if ((error as { status?: number } | null)?.status === 409)
      invalidateLearnerEvaluation(enrollmentId);
  };
  const runtime = useEvaluationLifecycle({
    enrollmentId,
    evaluationId: evaluation.id,
    nodeExecutionId: executionContext?.node_execution_id ?? evaluation.execution.readExecutionId,
    onCompleted: (response) => {
      // Pin/show results before cache updates can move the current execution.
      const score = response.data.score ?? 0;
      setResult({
        scope: resultScope,
        nodeExecutionId:
          response.data.node_execution_id ??
          executionContext?.node_execution_id ??
          evaluation.execution.readExecutionId,
        score,
        passingScore: evaluation.passingScore,
        reason: response.data.completion_reason ?? null,
      });
      onComplete(score, score >= evaluation.passingScore, response.data.completion_reason);
      const cached = queryClient.getQueryData<Formation>(
        portalLearningPathKeys.summary(enrollmentId),
      );
      if (
        response.execution &&
        response.execution.state_revision >= (cached?.execution.stateRevision ?? 0)
      ) {
        adoptExecutionSnapshot(queryClient, enrollmentId, response.execution);
      }
      invalidateLearnerEvaluation(enrollmentId);
    },
    onStartError: handleExecutionError,
    onRuntimeError: handleExecutionError,
  });
  // Resolving an unopened retry must not trap the learner on a confirmed result
  // (or block the player's manual failure dialog). Active attempts stay guarded.
  useEvaluationNavigationGuard(runtime.navigationLocked && (!result || !!runtime.attempt), root);
  const { attempt } = runtime;

  const apiQuestions = useMemo<Question[]>(
    () => (attempt ? attempt.quizzes.map(normalizeAttemptQuiz) : []),
    [attempt],
  );

  function handleRealStart() {
    if (
      isCheckingAttempts ||
      isEvalInfoError ||
      isLockedByExecution ||
      !executionContext ||
      quota.attemptsRemaining === 0
    )
      return;
    void runtime.start(executionContext);
  }

  if (result) {
    // Same-page /start on the completed visit replays its old result. A retry
    // requires a DIFFERENT server visit whose session was resolved as empty.
    const canRetry =
      !isLockedByExecution &&
      !!executionContext &&
      result.nodeExecutionId !== null &&
      executionContext.node_execution_id !== result.nodeExecutionId &&
      runtime.phase === 'ready' &&
      !attempt;
    return (
      <div ref={root}>
        <EvaluationResult
          score={result.score}
          completionReason={result.reason}
          passingScore={result.passingScore}
          maxAttempts={quota.maxAttempts}
          attemptsUsed={quota.attemptsUsed}
          attemptsRemaining={quota.attemptsRemaining}
          onRetry={canRetry ? () => setResult(null) : undefined}
        />
        {runtime.phase === 'recovery_error' && (
          <div className="pb-6 text-center">
            <p role="alert">{runtime.error}</p>
            <Button onClick={() => void runtime.recover()}>Réessayer la vérification</Button>
          </div>
        )}
      </div>
    );
  }

  if (runtime.phase === 'checking' || runtime.phase === 'recovery_error') {
    return (
      <div
        ref={root}
        className="mx-auto flex max-w-2xl flex-col items-center gap-4 p-10 text-center"
      >
        {runtime.phase === 'checking' ? (
          <>
            <Loader2 className="size-6 animate-spin" />
            <p role="status">Vérification de votre session d'évaluation…</p>
          </>
        ) : (
          <>
            <p role="alert">{runtime.error}</p>
            <Button onClick={() => void runtime.recover()}>Réessayer la vérification</Button>
          </>
        )}
      </div>
    );
  }

  // Un passage acquis se consulte sans réafficher les consignes de démarrage.
  // L'historique seul ne suffit pas : un nœud à refaire reste en retry/locked.
  if (evaluation.status === 'completed' && !attempt) {
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

  if (attempt) {
    return (
      <div ref={root}>
        <Quiz
          key={attempt.id}
          questions={apiQuestions}
          title={evaluation.title}
          description={evalDescription}
          sessionId={attempt.id}
          serverManaged
          initialAnswers={runtime.saves?.getAnswers()}
          onAnswerChange={runtime.saves?.change}
          canEdit={() =>
            !runtime.frozen &&
            !runtime.submitting &&
            !evaluationExpired(attempt.id) &&
            !evaluationDocument().frozen.has(attempt.id)
          }
          disabled={runtime.frozen || runtime.submitting}
          countdown={runtime.deadline.formatted}
          savedQuestionIds={runtime.autosave.savedIds}
          onSubmit={() => void runtime.submitManual()}
          runtimeStatus={
            <div className="border-b bg-muted/30 px-6 py-3 text-sm">
              {runtime.frozen ? (
                <>
                  <p role="alert" className="font-semibold">
                    Temps écoulé. Vos réponses sont verrouillées.
                  </p>
                  <p>Seules les réponses enregistrées avant la fin du temps seront évaluées.</p>
                  {runtime.error && <p role="alert">{runtime.error}</p>}
                  {runtime.submitting ? (
                    <p role="status">Finalisation de votre évaluation…</p>
                  ) : (
                    <Button className="mt-2" onClick={() => void runtime.finalizeTimeout()}>
                      Réessayer la finalisation
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {runtime.autosave.failed ? (
                    <div role="alert">
                      Certaines réponses ne sont pas enregistrées. Vérifiez votre connexion.
                      <Button
                        variant="outline"
                        className="ml-3"
                        onClick={() => runtime.saves?.retry()}
                      >
                        Réessayer la sauvegarde
                      </Button>
                    </div>
                  ) : (
                    <p role="status">
                      {runtime.submitting
                        ? 'Envoi de vos réponses…'
                        : runtime.autosave.pending
                          ? 'Enregistrement des réponses…'
                          : 'Toutes les modifications sont enregistrées.'}
                    </p>
                  )}
                  {runtime.error && <p role="alert">{runtime.error}</p>}
                </>
              )}
            </div>
          }
        />
      </div>
    );
  }

  // splash
  return (
    <div ref={root}>
      <EvaluationSplash
        title={evaluation.title}
        evaluationType={evaluation.evaluationType}
        onStart={handleRealStart}
        isLoading={runtime.phase === 'starting'}
        timeLimitMinutes={configuredLimit !== undefined ? configuredLimit : catalogueLimit}
        isCheckingAttempts={isCheckingAttempts}
        hasAttemptsError={isEvalInfoError}
        onRetryAttempts={() => void refetchEvalInfo()}
        maxAttempts={quota.maxAttempts}
        attemptsUsed={quota.attemptsUsed}
        attemptsRemaining={quota.attemptsRemaining}
        isLocked={isLockedByExecution}
        lockedReason={lockedReason(evaluation)}
      />
    </div>
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
