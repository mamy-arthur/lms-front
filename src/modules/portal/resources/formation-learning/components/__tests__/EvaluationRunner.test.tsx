import { StrictMode, type ComponentProps, type ReactNode } from 'react';
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { portalLearningPathKeys, portalMyEnrollmentsKeys } from '@/shared/queries/keys';
import { renderWithQueryClient } from '@/shared/lib/test-utils';
import {
  evaluationAttemptsApi,
  portalLearningPathsApi,
  type EvaluationAttemptResponse,
} from '@/shared/api/portal.api';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useTenantStore } from '@/shared/stores/tenant.store';
import { evaluationDocument } from '../../lib/evaluation-document-session';
import { evaluationAttempt } from '../../lib/__fixtures__/evaluation-attempt';
import {
  evaluationUser,
  resetEvaluationIdentity,
} from '../../lib/__fixtures__/evaluation-identity';
import { buildExecutionSummary, visit } from '../../lib/__fixtures__/execution-summary';
import { mapSummaryToFormation } from '../../lib/summary-mapper';
import type { FormationEvaluation } from '../../lib/types';
import EvaluationRunner from '../EvaluationRunner';

jest.mock('@/shared/api/portal.api', () => ({
  evaluationAttemptsApi: {
    session: jest.fn(),
    start: jest.fn(),
    get: jest.fn(),
    answer: jest.fn(),
    submit: jest.fn(),
  },
  portalLearningPathsApi: { learnerEvaluations: jest.fn() },
}));
jest.mock('@/shared/simulation/useSimulationUser', () => ({
  useSimulationUser: () => ({ name: 'Candidate' }),
}));
jest.mock('sonner', () => ({ toast: { error: jest.fn() } }));
const api = jest.mocked(evaluationAttemptsApi);
type EvaluationAttemptSessionResponse = Awaited<ReturnType<typeof evaluationAttemptsApi.session>>;
const timeoutNotice = 'Temps écoulé. Votre évaluation a été terminée automatiquement.';
const retryButtonName = /^Réessayer(?: \(|$)/;
const evaluation: FormationEvaluation = {
  id: 'evaluation-1',
  formationId: 'formation-1',
  type: 'evaluation',
  evaluationType: 'final',
  title: 'Évaluation finale',
  status: 'available',
  order: 1,
  passingScore: 80,
  timeLimitMinutes: 1,
  execution: {
    currentExecutionId: 'visit-1',
    currentVisit: null,
    readExecutionId: 'visit-1',
    current: true,
    actionable: true,
    readable: true,
    requiredToRepeat: false,
    historicalCompleted: false,
    currentScore: null,
    currentResult: null,
    round: null,
    nextAction: null,
    progressPercent: 0,
    coveragePercent: 0,
  },
};
function setup(strict = false, surrounding?: ReactNode) {
  const onComplete = jest.fn();
  const ui = (props: Partial<ComponentProps<typeof EvaluationRunner>> = {}) => (
    <>
      {surrounding}
      <EvaluationRunner
        evaluation={evaluation}
        enrollmentId="enrollment-1"
        executionContext={{ node_execution_id: 'visit-1', expected_state_revision: 1 }}
        onComplete={onComplete}
        {...props}
      />
    </>
  );
  const view = renderWithQueryClient(strict ? <StrictMode>{ui()}</StrictMode> : ui());
  const rerenderRunner = (props: Partial<ComponentProps<typeof EvaluationRunner>>) =>
    view.rerender(strict ? <StrictMode>{ui(props)}</StrictMode> : ui(props));
  return { ...view, onComplete, rerenderRunner };
}

const retryContext = { node_execution_id: 'visit-2', expected_state_revision: 4 };
const retryEvaluation: FormationEvaluation = {
  ...evaluation,
  status: 'retry',
  execution: {
    ...evaluation.execution,
    currentExecutionId: 'visit-2',
    readExecutionId: 'visit-2',
    requiredToRepeat: true,
    historicalCompleted: true,
  },
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
async function start() {
  fireEvent.click(await screen.findByRole('button', { name: "Commencer l'évaluation" }));
  await screen.findByRole('main', { name: 'Examen : Évaluation finale' });
}

describe('Exécution des évaluations', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    resetEvaluationIdentity();
    delete window.__learneoEvaluationDocument;
    window.history.replaceState({}, '', '/evaluation');
    api.session.mockResolvedValue({ data: null });
    api.start.mockImplementation(async (_enrollment, _evaluation, context) => ({
      data: evaluationAttempt({ page_session_id: context.page_session_id }),
    }));
    api.get.mockResolvedValue({ data: evaluationAttempt() });
    api.answer.mockResolvedValue({ data: evaluationAttempt() });
    api.submit.mockResolvedValue({
      data: evaluationAttempt({ status: 'completed', score: 100, completion_reason: 'manual' }),
    });
    jest.mocked(portalLearningPathsApi.learnerEvaluations).mockResolvedValue({
      data: [
        {
          id: 'evaluation-1',
          title: 'Évaluation finale',
          type: 'final',
          question_count: 1,
          allow_review: false,
          max_attempts: 3,
          attempts_used: 0,
          attempts_remaining: 3,
          last_attempt_status: null,
        },
      ],
    });
  });
  afterEach(() => {
    cleanup();
    jest.useRealTimers();
  });

  it('vérifie la session avant le démarrage et présente la limite configurée sans lancer le compteur', async () => {
    setup();
    expect(screen.getByRole('status')).toHaveTextContent('Vérification de votre session');
    expect(
      screen.queryByRole('button', { name: "Commencer l'évaluation" }),
    ).not.toBeInTheDocument();
    await screen.findByRole('button', { name: "Commencer l'évaluation" });
    expect(screen.getByText(/Temps limité : 1 minute/)).toBeInTheDocument();
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
    expect(api.start).not.toHaveBeenCalled();
  });

  it('maintient le blocage de récupération après une erreur réseau', async () => {
    api.session.mockRejectedValueOnce(new Error('offline'));
    setup();
    fireEvent.click(await screen.findByRole('button', { name: 'Réessayer la vérification' }));
    await screen.findByRole('button', { name: "Commencer l'évaluation" });
    expect(api.session).toHaveBeenCalledTimes(2);
    expect(api.start).not.toHaveBeenCalled();
  });

  it('sauvegarde les réponses et effacements révisionnés avec un retour explicite en cas d’échec', async () => {
    api.answer.mockRejectedValueOnce(new Error('offline'));
    setup(true);
    await start();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: /Option A/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Certaines réponses ne sont pas enregistrées.',
    );
    expect(screen.queryByText('Réponse enregistrée')).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Option A/ })).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer la sauvegarde' }));
    await screen.findByText('Réponse enregistrée');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Réessayer la sauvegarde' }),
    ).not.toBeInTheDocument();
    expect(api.answer.mock.calls.map((call) => call[2].answer_revision)).toEqual([1, 1]);
    fireEvent.click(screen.getByRole('checkbox', { name: /Option A/ }));
    await waitFor(() => expect(api.answer).toHaveBeenCalledTimes(3));
    expect(api.answer).toHaveBeenLastCalledWith('attempt-1', 'question-1', {
      clear: true,
      answer_revision: 2,
      page_session_id: evaluationDocument().id,
    });
    expect(screen.getByRole('button', { name: 'Terminer le quiz' })).toBeDisabled();
  });

  it('autorise Retour et Soumettre dans le vrai portail détenu par l’évaluation sans ouvrir la navigation extérieure', async () => {
    const user = userEvent.setup();
    const outside = jest.fn();
    api.submit.mockRejectedValueOnce(new Error('offline'));
    const { onComplete } = setup(
      true,
      <nav data-testid="outside-navigation">
        <button onClick={outside}>Autre module</button>
        <div role="dialog" aria-label="Dialogue extérieur">
          <button onClick={outside}>Quitter le parcours</button>
        </div>
        <a href="/elsewhere" onClick={outside}>
          Accueil
        </a>
      </nav>,
    );
    await user.click(await screen.findByRole('button', { name: "Commencer l'évaluation" }));
    const exam = await screen.findByRole('main', { name: 'Examen : Évaluation finale' });
    const root = exam.parentElement!;
    const outsideButton = screen.getByText('Quitter le parcours');
    expect(screen.getByTestId('outside-navigation').inert).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Terminer le quiz' }));
    expect(screen.queryByRole('dialog', { name: 'Terminer le quiz ?' })).not.toBeInTheDocument();
    expect(api.submit).not.toHaveBeenCalled();
    await user.click(screen.getByRole('checkbox', { name: /Option A/ }));
    await screen.findByText('Réponse enregistrée');
    await user.click(screen.getByRole('button', { name: 'Terminer le quiz' }));
    const dialog = screen.getByRole('dialog', { name: 'Terminer le quiz ?' });
    expect(dialog.closest('[data-exam-portal]')).not.toBeNull();
    expect(root).toContainElement(dialog);
    for (let element: HTMLElement | null = dialog; element; element = element.parentElement) {
      expect(element.inert).not.toBe(true);
    }
    // Synthetic events also exercise the capture fence despite Radix's body pointer lock.
    expect(fireEvent.click(outsideButton)).toBe(false);
    expect(fireEvent.click(screen.getByText('Accueil'))).toBe(false);
    expect(outside).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole('button', { name: 'Retour' }));
    expect(screen.queryByRole('dialog', { name: 'Terminer le quiz ?' })).not.toBeInTheDocument();
    expect(api.submit).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Terminer le quiz' }));
    await user.click(screen.getByRole('button', { name: 'Soumettre le quiz' }));
    await screen.findByRole('alert');
    expect(screen.getByRole('checkbox', { name: /Option A/ })).toBeChecked();
    expect(screen.getByRole('main', { name: 'Examen : Évaluation finale' })).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Terminer le quiz' }));
    await user.click(screen.getByRole('button', { name: 'Soumettre le quiz' }));
    await screen.findByText("Résultat de l'évaluation");
    expect(api.submit).toHaveBeenCalledTimes(2);
    expect(api.submit).toHaveBeenLastCalledWith('attempt-1', { reason: 'manual' });
    expect(onComplete).toHaveBeenCalledWith(100, true, 'manual');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('outside-navigation').inert).not.toBe(true);
    await user.click(screen.getByRole('button', { name: 'Autre module' }));
    expect(outside).toHaveBeenCalledTimes(1);
  });

  it.each([
    {
      status: 409,
      json: { error_code: 'execution_conflict', message: 'Cette visite a changé.' },
      conflict: true,
    },
    { status: 422, json: { errors: { node_execution_id: ['Visite invalide.'] } }, conflict: true },
    { status: 403, json: { message: 'Inscription révoquée.' }, conflict: false },
  ])(
    'propose une vérification explicite après un poll $status sans rejouer de mutation',
    async ({ status, json, conflict }) => {
      jest.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      api.get.mockRejectedValueOnce({ status, json });
      const { queryClient, onComplete } = setup();
      const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
      await start();
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });
      const retry = await screen.findByRole('button', { name: 'Réessayer la vérification' });
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.queryByRole('main', { name: /Examen/ })).not.toBeInTheDocument();
      if (conflict) {
        expect(invalidate).toHaveBeenCalledWith({
          queryKey: portalLearningPathKeys.summary('enrollment-1'),
        });
        expect(invalidate).toHaveBeenCalledWith({ queryKey: portalMyEnrollmentsKeys.all });
        expect(toast.error).toHaveBeenCalledTimes(1);
      } else {
        expect(toast.error).not.toHaveBeenCalled();
      }
      await act(async () => {
        jest.advanceTimersByTime(10000);
        window.dispatchEvent(new Event('online'));
      });
      expect(api.get).toHaveBeenCalledTimes(1);
      expect(api.start).toHaveBeenCalledTimes(1);
      expect(api.submit).not.toHaveBeenCalled();
      expect(api.answer).not.toHaveBeenCalled();
      expect(onComplete).not.toHaveBeenCalled();
      await user.click(retry);
      await screen.findByRole('button', { name: "Commencer l'évaluation" });
      expect(api.session).toHaveBeenCalledTimes(2);
      expect(api.start).toHaveBeenCalledTimes(1);
      invalidate.mockRestore();
    },
  );

  it('affiche le motif automatique au rechargement et attend un nouveau démarrage explicite', async () => {
    api.session.mockResolvedValue({
      data: evaluationAttempt({ status: 'completed', score: 0, completion_reason: 'page_reload' }),
    });
    const { rerenderRunner } = setup(true);
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'Tentative interrompue. Votre évaluation a été terminée après le rechargement ou la réouverture de la page.',
      ),
    );
    expect(screen.queryByRole('main', { name: /Examen/ })).not.toBeInTheDocument();
    expect(api.start).not.toHaveBeenCalled();
    // Even if props still say actionable, a completed visit cannot be retried.
    expect(screen.queryByRole('button', { name: retryButtonName })).not.toBeInTheDocument();
    api.session.mockResolvedValue({ data: null });
    rerenderRunner({ evaluation: retryEvaluation, executionContext: retryContext });
    fireEvent.click(await screen.findByRole('button', { name: retryButtonName }));
    await screen.findByRole('button', { name: "Commencer l'évaluation" });
    expect(api.start).not.toHaveBeenCalled();
  });

  it('conserve le score et le motif timeout quand le snapshot ouvre une nouvelle visite, puis démarre seulement après Réessayer et Commencer', async () => {
    jest.useFakeTimers();
    const freshSession = deferred<EvaluationAttemptSessionResponse>();
    const summary = buildExecutionSummary({
      modules: [],
      stateRevision: retryContext.expected_state_revision,
      currentExecution: visit({
        id: 'visit-2',
        node_type: 'evaluation',
        node_id: evaluation.id,
        visit_number: 2,
        validation_round_id: 'round-1',
      }),
    });
    api.start.mockImplementationOnce(async (_enrollment, _evaluation, context) => ({
      data: evaluationAttempt({
        page_session_id: context.page_session_id,
        time_limit_minutes: 1,
        expires_at: '2026-10-01T12:00:01.000Z',
      }),
    }));
    api.submit.mockResolvedValue({
      data: evaluationAttempt({ status: 'completed', completion_reason: 'timeout', score: 25 }),
      execution: summary.execution,
    });
    const { onComplete, queryClient, rerenderRunner } = setup(true);
    queryClient.setQueryData(
      portalLearningPathKeys.summary('enrollment-1'),
      mapSummaryToFormation({
        ...summary,
        execution: { ...summary.execution, state_revision: 1 },
      }),
    );
    await start();
    fireEvent.click(screen.getByRole('checkbox', { name: /Option A/ }));
    await screen.findByText('Réponse enregistrée');
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(timeoutNotice));
    expect(onComplete).toHaveBeenCalledWith(25, false, 'timeout');
    expect(queryClient.getQueryData(portalLearningPathKeys.summary('enrollment-1'))).toMatchObject({
      execution: { currentExecution: { id: 'visit-2' }, stateRevision: 4 },
    });

    // Mirror the player's new props after adopting/refetching that snapshot.
    api.session.mockReturnValueOnce(freshSession.promise);
    rerenderRunner({ evaluation: retryEvaluation, executionContext: retryContext });
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(timeoutNotice);
    expect(screen.queryByRole('button', { name: retryButtonName })).not.toBeInTheDocument();
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
    expect(evaluationDocument().saves.has('attempt-1')).toBe(false);
    expect(evaluationDocument().navigationLocks).toBe(0);
    await act(async () => {
      freshSession.resolve({ data: null });
    });
    const retry = await screen.findByRole('button', { name: retryButtonName });
    expect(retry).toHaveAccessibleName('Réessayer (3 restantes)');
    expect(api.session).toHaveBeenLastCalledWith('enrollment-1', 'evaluation-1', {
      node_execution_id: 'visit-2',
      page_session_id: evaluationDocument().id,
    });
    await act(async () => {
      jest.advanceTimersByTime(15000);
    });
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(api.start).toHaveBeenCalledTimes(1);
    expect(api.submit).toHaveBeenCalledTimes(1);
    expect(api.get).not.toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalledTimes(1);

    fireEvent.click(retry);
    await screen.findByRole('button', { name: "Commencer l'évaluation" });
    expect(screen.queryByText("Résultat de l'évaluation")).not.toBeInTheDocument();
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
    expect(api.start).toHaveBeenCalledTimes(1);
    api.start.mockResolvedValueOnce({
      data: evaluationAttempt({
        id: 'attempt-2',
        node_execution_id: 'visit-2',
        page_session_id: evaluationDocument().id,
        time_limit_minutes: 1,
        started_at: '2026-10-01T12:01:00.000Z',
        server_now: '2026-10-01T12:01:00.000Z',
        expires_at: '2026-10-01T12:02:00.000Z',
      }),
    });
    await start();
    expect(api.start).toHaveBeenLastCalledWith('enrollment-1', 'evaluation-1', {
      ...retryContext,
      page_session_id: evaluationDocument().id,
    });
    expect(screen.getByRole('timer')).toHaveTextContent('01:00');
    expect(screen.getByRole('checkbox', { name: /Option A/ })).not.toBeChecked();
    expect(api.answer).toHaveBeenCalledTimes(1);
    expect(api.submit).toHaveBeenCalledTimes(1);
  });

  it('conserve le résultat si la vérification de la nouvelle visite échoue sans permettre un démarrage aveugle', async () => {
    api.session.mockResolvedValueOnce({
      data: evaluationAttempt({ status: 'completed', completion_reason: 'timeout', score: 25 }),
    });
    const { rerenderRunner } = setup();
    await screen.findByText('25%');
    api.session.mockRejectedValueOnce(new Error('offline'));
    rerenderRunner({ evaluation: retryEvaluation, executionContext: retryContext });
    fireEvent.click(await screen.findByRole('button', { name: 'Réessayer la vérification' }));
    await screen.findByRole('button', { name: retryButtonName });
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(timeoutNotice);
    expect(api.start).not.toHaveBeenCalled();
    expect(api.submit).not.toHaveBeenCalled();
  });

  it.each(['enrollment', 'evaluation', 'auth', 'tenant', 'document'] as const)(
    'ne conserve pas le résultat confirmé après changement de %s',
    async (boundary) => {
      api.session.mockResolvedValueOnce({
        data: evaluationAttempt({ status: 'completed', completion_reason: 'timeout', score: 25 }),
      });
      const { rerenderRunner } = setup();
      await screen.findByText('25%');
      const pending = deferred<EvaluationAttemptSessionResponse>();
      api.session.mockReturnValue(pending.promise);
      act(() => {
        if (boundary === 'auth') useAuthStore.getState().setAuth(evaluationUser, 'session-b');
        if (boundary === 'tenant') useTenantStore.getState().clearTenant();
        if (boundary === 'document') delete window.__learneoEvaluationDocument;
      });
      rerenderRunner({
        enrollmentId: boundary === 'enrollment' ? 'enrollment-2' : 'enrollment-1',
        evaluation: boundary === 'evaluation' ? { ...evaluation, id: 'evaluation-2' } : evaluation,
      });
      expect(screen.queryByText('25%')).not.toBeInTheDocument();
      expect(screen.queryByText('Temps écoulé.')).not.toBeInTheDocument();
      await act(async () => {
        pending.resolve({ data: null });
      });
      await screen.findByRole('button', { name: "Commencer l'évaluation" });
      // A -> B -> A must not resurrect the old display either.
      rerenderRunner({});
      expect(screen.queryByText('25%')).not.toBeInTheDocument();
      expect(api.start).not.toHaveBeenCalled();
    },
  );

  it('abandonne le résultat local quand l’apprenant quitte l’évaluation puis revient sur la nouvelle visite', async () => {
    api.session.mockResolvedValueOnce({
      data: evaluationAttempt({ status: 'completed', completion_reason: 'timeout', score: 25 }),
    });
    const { rerenderRunner, unmount } = setup();
    await screen.findByText('25%');
    rerenderRunner({ evaluation: retryEvaluation, executionContext: retryContext });
    await screen.findByRole('button', { name: retryButtonName });
    unmount();
    renderWithQueryClient(
      <EvaluationRunner
        evaluation={retryEvaluation}
        enrollmentId="enrollment-1"
        executionContext={retryContext}
        onComplete={jest.fn()}
      />,
    );
    await screen.findByRole('button', { name: "Commencer l'évaluation" });
    expect(screen.queryByText('25%')).not.toBeInTheDocument();
    expect(api.start).not.toHaveBeenCalled();
  });

  it('abandonne les réponses actives et une complétion tardive lors du changement de visite', async () => {
    const answer = deferred<EvaluationAttemptResponse>();
    api.answer.mockReturnValueOnce(answer.promise);
    const { rerenderRunner, onComplete } = setup();
    await start();
    fireEvent.click(screen.getByRole('checkbox', { name: /Option A/ }));
    await waitFor(() => expect(api.answer).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('checkbox', { name: /Option B/ }));
    rerenderRunner({ evaluation: retryEvaluation, executionContext: retryContext });
    expect(screen.queryByRole('main', { name: /Examen/ })).not.toBeInTheDocument();
    await screen.findByRole('button', { name: "Commencer l'évaluation" });
    await act(async () => {
      answer.resolve({
        data: evaluationAttempt({ status: 'completed', completion_reason: 'timeout', score: 25 }),
      });
    });
    expect(screen.queryByText("Résultat de l'évaluation")).not.toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
    expect(api.answer).toHaveBeenCalledTimes(1);
    expect(api.start).toHaveBeenCalledTimes(1);
    expect(api.submit).not.toHaveBeenCalled();
    expect(evaluationDocument().saves.has('attempt-1')).toBe(false);
  });

  it.each(['bouton', 'online'] as const)(
    'garde le compteur et les réponses figés après échec de finalisation puis réessaie via %s',
    async (retryVia) => {
      jest.useFakeTimers();
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const finalization = deferred<EvaluationAttemptResponse>();
      api.start.mockResolvedValue({
        data: evaluationAttempt({ time_limit_minutes: 1, expires_at: '2026-10-01T12:00:01.000Z' }),
      });
      api.submit
        .mockRejectedValueOnce(new Error('offline'))
        .mockReturnValueOnce(finalization.promise);
      const { onComplete } = setup();
      await start();
      expect(screen.getByRole('timer', { name: 'Temps restant' })).toHaveTextContent('00:01');
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      expect(screen.getByRole('timer')).toHaveTextContent('00:00');
      expect(screen.getByRole('checkbox', { name: /Option A/ })).toBeDisabled();
      expect(screen.getByText('Temps écoulé. Vos réponses sont verrouillées.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Réessayer la finalisation' })).toBeEnabled();
      expect(api.answer).not.toHaveBeenCalled();
      expect(api.submit).toHaveBeenCalledTimes(1);
      if (retryVia === 'bouton') {
        await user.click(screen.getByRole('button', { name: 'Réessayer la finalisation' }));
      } else {
        await act(async () => {
          window.dispatchEvent(new Event('online'));
        });
      }
      expect(screen.getByRole('status')).toHaveTextContent('Finalisation de votre évaluation');
      expect(
        screen.queryByRole('button', { name: 'Réessayer la finalisation' }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /Option A/ })).toBeDisabled();
      expect(screen.getByRole('timer')).toHaveTextContent('00:00');
      expect(onComplete).not.toHaveBeenCalled();
      await act(async () => {
        finalization.resolve({
          data: evaluationAttempt({ status: 'completed', completion_reason: 'timeout', score: 0 }),
        });
      });
      await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(timeoutNotice));
      expect(api.submit).toHaveBeenCalledTimes(2);
      expect(api.submit).toHaveBeenLastCalledWith('attempt-1', { reason: 'timeout' });
      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledWith(0, false, 'timeout');
      expect(api.answer).not.toHaveBeenCalled();
    },
  );
});
