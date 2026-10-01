'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { evaluationAttemptsApi, type EvaluationAttemptResponse } from '@/shared/api/portal.api';
import type { ApiEvaluationAttempt } from '@/shared/types/evaluation-attempt.types';
import type { ExecutionMutationContext } from '@/shared/types/progression.types';
import { getApiErrorMessage, getApiErrorStatus } from '@/shared/lib/errors';
import { EvaluationAutosave } from '../lib/evaluation-autosave';
import {
  anchorEvaluationClock,
  evaluationExpired,
  isEvaluationDocumentCurrent,
} from '../lib/evaluation-document-session';
import { useEvaluationDocument } from './useEvaluationDocument';
import { useEvaluationDeadline } from './useEvaluationDeadline';
import { useEvaluationAutosave } from './useEvaluationAutosave';
import { normalizeAttemptQuiz } from '../lib/evaluation-attempt-utils';
import { isQuestionAnswered } from '@/modules/quizzes/utils/answer-completeness';

type Phase =
  'checking' | 'recovery_error' | 'ready' | 'starting' | 'active' | 'finalizing' | 'completed';
interface State {
  identity: string;
  phase: Phase;
  attempt: ApiEvaluationAttempt | null;
  error: string | null;
  submitting: boolean;
}
interface Options {
  enrollmentId: string;
  evaluationId: string;
  nodeExecutionId: string | null;
  onCompleted: (response: EvaluationAttemptResponse) => void;
  onStartError: (error: unknown) => void;
  onRuntimeError?: (error: unknown) => void;
}

const initialState = (identity: string): State => ({
  identity,
  phase: 'checking',
  attempt: null,
  error: null,
  submitting: false,
});

export function useEvaluationLifecycle({
  enrollmentId,
  evaluationId,
  nodeExecutionId,
  onCompleted,
  onStartError,
  onRuntimeError,
}: Options) {
  const document = useEvaluationDocument();
  const identity = JSON.stringify([document?.id, enrollmentId, evaluationId, nodeExecutionId]);
  const [storedState, setState] = useState<State>(() => initialState(identity));
  // Do not render or subscribe to the old visit while the layout effect resets it.
  const state = storedState.identity === identity ? storedState : initialState(identity);
  const current = useRef(state);
  const ownedDocument = useRef(document);
  const mounted = useRef(false);
  const generation = useRef(0);
  const finalizing = useRef<string | null>(null);
  const callbacks = useRef({ onCompleted, onStartError, onRuntimeError });
  useLayoutEffect(() => {
    callbacks.current = { onCompleted, onStartError, onRuntimeError };
  }, [onCompleted, onStartError, onRuntimeError]);
  useLayoutEffect(() => {
    mounted.current = true;
    if (current.current.identity !== identity) {
      const oldAttempt = current.current.attempt;
      if (oldAttempt) {
        ownedDocument.current?.saves.get(oldAttempt.id)?.stop();
        ownedDocument.current?.saves.delete(oldAttempt.id);
      }
      finalizing.current = null;
      current.current = initialState(identity);
      setState(current.current);
    }
    ownedDocument.current = document;
    // A revision refresh is NOT a new identity; StrictMode preserves same-page drafts.
    return () => {
      mounted.current = false;
      generation.current += 1;
    };
  }, [document, identity]);

  const isCurrent = useCallback(
    (ticket = generation.current) =>
      !!document?.available &&
      isEvaluationDocumentCurrent(document) &&
      mounted.current &&
      current.current.identity === identity &&
      ticket === generation.current,
    [document, identity],
  );

  const update = useCallback(
    (patch: Partial<State>) => {
      if (!isCurrent()) return;
      current.current = { ...current.current, ...patch };
      setState(current.current);
    },
    [isCurrent],
  );

  const requireRecovery = useCallback(
    (error: unknown) => {
      if (!isCurrent()) return;
      generation.current += 1; // Ignore in-flight answers, polls and submits from before the refusal.
      const attempt = current.current.attempt;
      if (attempt) {
        document?.saves.get(attempt.id)?.stop();
        // Recovery rehydrates server answers, never replays rejected/queued writes.
        document?.saves.delete(attempt.id);
      }
      finalizing.current = null;
      update({
        phase: 'recovery_error',
        attempt: null,
        submitting: false,
        error: getApiErrorMessage(
          error,
          'Impossible de vérifier cette tentative. Réessayez la vérification de la session.',
        ),
      });
      callbacks.current.onRuntimeError?.(error);
    },
    [document, isCurrent, update],
  );

  const accept = useCallback(
    (response: EvaluationAttemptResponse, ticket: number) => {
      if (!document || !isCurrent(ticket) || current.current.phase === 'completed') return;
      const attempt = response.data;
      if (
        attempt.evaluation_id !== evaluationId ||
        (attempt.enrollment_id != null && attempt.enrollment_id !== enrollmentId) ||
        (attempt.node_execution_id != null && attempt.node_execution_id !== nodeExecutionId)
      ) {
        throw new Error('Le contexte de cette tentative a changé. Vérifiez à nouveau la session.');
      }
      if (current.current.attempt && current.current.attempt.id !== attempt.id) return;
      if (attempt.status === 'completed') {
        document.saves.get(attempt.id)?.stop();
        update({ attempt, phase: 'completed', submitting: false, error: null });
        callbacks.current.onCompleted(response);
        return;
      }
      if (attempt.status !== 'in_progress') {
        throw new Error('Cette tentative n’est plus active. Vérifiez à nouveau la session.');
      }
      if (attempt.page_session_id != null && attempt.page_session_id !== document.id) {
        throw new Error(
          'Cette tentative appartient à une autre session. Vérifiez à nouveau la session.',
        );
      }
      anchorEvaluationClock(attempt, document);
      if (!document.saves.has(attempt.id)) {
        document.saves.set(
          attempt.id,
          new EvaluationAutosave(
            attempt,
            document.id,
            (id, quizId, payload) => evaluationAttemptsApi.answer(id, quizId, payload),
            () => !document.frozen.has(attempt.id) && !evaluationExpired(attempt.id, document),
            () => isEvaluationDocumentCurrent(document),
          ),
        );
      }
      const frozen = document.frozen.has(attempt.id) || evaluationExpired(attempt.id, document);
      // Keep the original quiz objects/drafts when a poll merely confirms liveness.
      update({
        attempt: current.current.attempt ?? attempt,
        phase: frozen ? 'finalizing' : 'active',
        error: null,
      });
    },
    [document, enrollmentId, evaluationId, nodeExecutionId, isCurrent, update],
  );

  const recover = useCallback(async () => {
    if (!document || !isCurrent() || !['checking', 'recovery_error'].includes(current.current.phase))
      return;
    const ticket = ++generation.current;
    update({ phase: 'checking', error: null, submitting: false });
    if (!nodeExecutionId) {
      update({ phase: 'ready' }); // No visit: only a locked/read-only splash is possible.
      return;
    }
    try {
      const response = await evaluationAttemptsApi.session(enrollmentId, evaluationId, {
        node_execution_id: nodeExecutionId,
        page_session_id: document.id,
      });
      if (!isCurrent(ticket)) return;
      if (response.data) accept({ ...response, data: response.data }, ticket);
      else update({ phase: 'ready', attempt: null });
    } catch (error) {
      if (isCurrent(ticket)) requireRecovery(error);
    }
  }, [
    accept,
    document,
    enrollmentId,
    evaluationId,
    nodeExecutionId,
    isCurrent,
    requireRecovery,
    update,
  ]);

  useEffect(() => {
    // Revision refreshes do not recover or restart a live attempt. StrictMode's
    // second setup DOES retry a cancelled recovery, using the same document UUID.
    if (['active', 'finalizing', 'completed'].includes(current.current.phase)) return;
    void recover();
  }, [recover]);

  useEffect(() => {
    if (state.phase !== 'recovery_error') return;
    const retry = () => {
      if (!isCurrent() || current.current.phase !== 'recovery_error') return;
      // Reconcile the session only; never replay a start, answer or submit.
      // recover() enters checking synchronously, coalescing repeated online events.
      void recover();
    };
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, [isCurrent, recover, state.phase]);

  const start = useCallback(
    async (context: ExecutionMutationContext) => {
      if (
        !document ||
        !isCurrent() ||
        current.current.phase !== 'ready' ||
        context.node_execution_id !== nodeExecutionId
      )
        return;
      update({ phase: 'starting', error: null, attempt: null });
      const ticket = ++generation.current;
      try {
        const response = await evaluationAttemptsApi.start(enrollmentId, evaluationId, {
          ...context,
          page_session_id: document.id,
        });
        if (isCurrent(ticket)) accept(response, ticket);
      } catch (error) {
        if (!isCurrent(ticket)) return;
        // An ambiguous network failure may have created an attempt. Recover it
        // before offering another explicit start; never send a blind second POST.
        update({
          phase: 'recovery_error',
          error: getApiErrorMessage(
            error,
            'Impossible de confirmer le démarrage. Vérifiez la session.',
          ),
        });
        callbacks.current.onStartError(error);
      }
    },
    [accept, document, enrollmentId, evaluationId, nodeExecutionId, isCurrent, update],
  );

  const attemptId = state.attempt?.id ?? null;
  const saves = attemptId ? (document?.saves.get(attemptId) ?? null) : null;
  const autosave = useEvaluationAutosave(saves, state.phase === 'active');
  const deadline = useEvaluationDeadline(state.phase === 'completed' ? null : attemptId);

  useEffect(() => {
    if (!autosave.completed || !isCurrent() || current.current.attempt?.id !== attemptId) return;
    try {
      accept(autosave.completed, generation.current);
    } catch (error) {
      requireRecovery(error);
    }
  }, [accept, attemptId, autosave.completed, isCurrent, requireRecovery]);

  const finalizeTimeout = useCallback(async () => {
    const ticket = generation.current;
    const attempt = current.current.attempt;
    if (
      !document ||
      !isCurrent(ticket) ||
      !attempt ||
      !['active', 'finalizing'].includes(current.current.phase) ||
      finalizing.current === attempt.id
    )
      return;
    if (!evaluationExpired(attempt.id, document) && !document.frozen.has(attempt.id)) return;
    document.frozen.add(attempt.id);
    document.saves.get(attempt.id)?.stop();
    finalizing.current = attempt.id;
    update({ phase: 'finalizing', error: null, submitting: true });
    let received = false;
    try {
      // Never flush answers here: the deadline is already over. Grade saved drafts.
      const response = await evaluationAttemptsApi.submit(attempt.id, { reason: 'timeout' });
      received = true;
      if (response.data.status !== 'completed') throw new Error('Finalisation non confirmée.');
      if (isCurrent(ticket) && current.current.attempt?.id === attempt.id) accept(response, ticket);
    } catch (error) {
      if (
        isCurrent(ticket) &&
        current.current.attempt?.id === attempt.id &&
        current.current.phase !== 'completed'
      ) {
        if (received || getApiErrorStatus(error) !== undefined) requireRecovery(error);
        else
          update({
            error: getApiErrorMessage(
              error,
              'La finalisation est en attente de connexion. Vos réponses restent verrouillées.',
            ),
          });
      }
    } finally {
      if (isCurrent(ticket)) {
        if (finalizing.current === attempt.id) finalizing.current = null;
        if (current.current.attempt?.id === attempt.id) update({ submitting: false });
      }
    }
  }, [accept, document, isCurrent, requireRecovery, update]);

  useEffect(() => {
    if (deadline.expired) void finalizeTimeout();
  }, [deadline.expired, finalizeTimeout]);
  useEffect(() => {
    if (state.phase !== 'finalizing') return;
    const retry = () => {
      void finalizeTimeout();
    };
    const timer = setInterval(retry, 5000);
    window.addEventListener('online', retry);
    return () => {
      clearInterval(timer);
      window.removeEventListener('online', retry);
    };
  }, [finalizeTimeout, state.phase]);

  useEffect(() => {
    if (!attemptId || !['active', 'finalizing'].includes(state.phase)) return;
    const ticket = generation.current;
    let cancelled = false;
    let pending = false;
    const poll = async () => {
      if (pending || cancelled || !isCurrent(ticket)) return;
      pending = true;
      let received = false;
      try {
        const response = await evaluationAttemptsApi.get(attemptId);
        received = true;
        if (!cancelled) accept(response, ticket);
      } catch (error) {
        // Only transport failures are safe to tolerate with the local deadline.
        // HTTP refusals and invalid/cancelled responses must stop all writes.
        if (
          !cancelled &&
          isCurrent(ticket) &&
          ['active', 'finalizing'].includes(current.current.phase) &&
          (received || getApiErrorStatus(error) !== undefined)
        )
          requireRecovery(error);
      } finally {
        pending = false;
      }
    };
    const timer = setInterval(() => void poll(), 5000);
    window.addEventListener('online', poll);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener('online', poll);
    };
  }, [accept, attemptId, isCurrent, requireRecovery, state.phase]);

  const submitManual = useCallback(async () => {
    const ticket = generation.current;
    const attempt = current.current.attempt;
    if (
      !document ||
      !isCurrent(ticket) ||
      !attempt ||
      current.current.phase !== 'active' ||
      current.current.submitting
    )
      return;
    if (evaluationExpired(attempt.id, document)) {
      void finalizeTimeout();
      return;
    }
    const manager = document.saves.get(attempt.id)!;
    const answers = manager.getAnswers();
    if (
      !attempt.quizzes.every((quiz) =>
        isQuestionAnswered(normalizeAttemptQuiz(quiz), answers[quiz.id]),
      )
    ) {
      update({ error: 'Répondez à toutes les questions avant de soumettre.' });
      return;
    }
    update({ submitting: true, error: null });
    let received = false;
    try {
      await manager.flush();
      if (!isCurrent(ticket) || current.current.attempt?.id !== attempt.id) return;
      if (manager.getSnapshot().completed) {
        accept(manager.getSnapshot().completed!, ticket);
        return;
      }
      if (evaluationExpired(attempt.id, document)) {
        void finalizeTimeout();
        return;
      }
      if (current.current.phase !== 'active') return;
      const response = await evaluationAttemptsApi.submit(attempt.id, { reason: 'manual' });
      received = true;
      if (response.data.status !== 'completed')
        throw new Error('Soumission non confirmée. Réessayez.');
      if (isCurrent(ticket) && current.current.attempt?.id === attempt.id) accept(response, ticket);
    } catch (error) {
      if (
        isCurrent(ticket) &&
        current.current.attempt?.id === attempt.id &&
        current.current.phase === 'active'
      ) {
        if (received || getApiErrorStatus(error) !== undefined) requireRecovery(error);
        else
          update({
            error: getApiErrorMessage(error, 'Impossible de soumettre les réponses. Réessayez.'),
          });
      }
    } finally {
      if (
        isCurrent(ticket) &&
        current.current.attempt?.id === attempt.id &&
        current.current.phase === 'active'
      )
        update({ submitting: false });
    }
  }, [accept, document, finalizeTimeout, isCurrent, requireRecovery, update]);

  return {
    ...state,
    deadline,
    saves,
    autosave,
    recover,
    start,
    submitManual,
    finalizeTimeout,
    frozen: state.phase === 'finalizing' || deadline.expired,
    navigationLocked: !!document?.available && !['ready', 'completed'].includes(state.phase),
  };
}
