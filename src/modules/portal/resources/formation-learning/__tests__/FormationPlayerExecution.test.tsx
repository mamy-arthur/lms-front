import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import {
  portalContentEntriesApi,
  portalContentTimeApi,
  portalLearningPathsApi,
} from '@/shared/api/portal.api';
import { progressionApi } from '@/shared/api/progression.api';
import { portalScormApi, type ApiScormTrackingState } from '@/shared/api/portal-scorm.api';
import type { ApiPortalLearningPathSummary } from '@/shared/types/portal.types';
import FormationPlayer from '../FormationPlayer';
import {
  ENROLLMENT_ID,
  buildExecutionSummary,
  type ModuleSpec,
  type SummarySpec,
} from '../lib/__fixtures__/execution-summary';

jest.mock('@/shared/api/portal.api', () => ({
  portalLearningPathsApi: { summary: jest.fn(), learnerEvaluations: jest.fn() },
  portalContentEntriesApi: { get: jest.fn(), markComplete: jest.fn() },
  portalContentTimeApi: { record: jest.fn().mockResolvedValue(undefined) },
  evaluationAttemptsApi: {
    session: jest.fn(),
    get: jest.fn(),
    start: jest.fn(),
    answer: jest.fn(),
    submit: jest.fn(),
  },
}));
jest.mock('@/shared/api/progression.api', () => ({
  progressionApi: {
    startNodeExecution: jest.fn(),
  },
}));
jest.mock('@/shared/api/portal-scorm.api', () => ({
  portalScormApi: {
    launch: jest.fn(),
    getTracking: jest.fn(),
    commitTracking: jest.fn(),
    getTrackingSequence: jest.fn(),
  },
}));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));

jest.mock('../components/EvaluationRunner', () => ({
  __esModule: true,
  default: ({ onComplete }: { onComplete: (score: number, passed: boolean) => void }) => (
    <button onClick={() => onComplete(0, false)}>Soumettre l’évaluation</button>
  ),
}));

const mockSummary = jest.mocked(portalLearningPathsApi.summary);
const mockGetEntry = jest.mocked(portalContentEntriesApi.get);
const mockComplete = jest.mocked(portalContentEntriesApi.markComplete);
const mockStart = jest.mocked(progressionApi.startNodeExecution);
const mockRecordTime = jest.mocked(portalContentTimeApi.record);
const mockScorm = jest.mocked(portalScormApi);

function configureScorm() {
  const module: ModuleSpec = {
    ...LOOPED_MODULE,
    visitStatus: 'in_progress',
    courses: [{ ...LOOPED_MODULE.courses[0], entries: [LOOPED_MODULE.courses[0].entries[0]] }],
  };
  useSummary(summary({ stateRevision: 8, modules: [module] }));
  mockGetEntry.mockResolvedValue({
    data: {
      id: 'entry-1',
      content_type_id: 'type-scorm',
      module_type: 'scorm',
      data: { scorm_package_id: 'package-1' },
      field_types: {},
      is_published: true,
    },
  });
  mockScorm.launch.mockResolvedValue({
    data: {
      enrollment_id: ENROLLMENT_ID,
      competency_id: 'module-1',
      content_entry_id: 'entry-1',
      node_execution_id: 'exec-module-1',
      scorm_package_id: 'package-1',
      version: '1.2',
      launch_path: 'index.html',
      launch_url: 'about:blank',
    },
  });
  const tracking: ApiScormTrackingState = {
    enrollment_id: ENROLLMENT_ID,
    competency_id: 'module-1',
    content_entry_id: 'entry-1',
    node_execution_id: 'exec-module-1',
    lesson_status: 'incomplete',
    score_raw: null,
    score_min: null,
    score_max: null,
    session_time: 0,
    total_time: 0,
    cmi_data: {},
    last_sequence: 0,
    last_commit_id: null,
    updated_at: null,
  };
  mockScorm.getTracking.mockResolvedValue({ data: tracking });
  mockComplete.mockImplementation(async () => {
    const completed = summary({
      status: 'completed',
      currentExecution: null,
      stateRevision: 9,
      modules: [
        {
          ...module,
          actionable: false,
          visitStatus: 'completed',
          requiredToRepeat: false,
          courses: [
            {
              ...module.courses[0],
              entries: [{ ...module.courses[0].entries[0], completed: true }],
            },
          ],
        },
      ],
    });
    useSummary(completed);
    return { data: completed.execution };
  });
  return tracking;
}

function scormWindowApi() {
  return (
    window as unknown as {
      API: {
        LMSSetValue: (name: string, value: string) => string;
        LMSCommit: () => string;
        LMSFinish: () => string;
      };
    }
  ).API;
}

function executionConflict() {
  return Object.assign(new Error('Conflict'), {
    status: 409,
    json: { message: 'Visite obsolète.', error_code: 'execution_conflict' },
  });
}

function useSummary(summary: ApiPortalLearningPathSummary) {
  mockSummary.mockImplementation(async () => ({ data: summary }));
}

/** Boucle : le module a déjà été terminé, mais le parcours y ramène. */
const LOOPED_MODULE: ModuleSpec = {
  id: 'module-1',
  name: 'Les bases',
  requiredToRepeat: true,
  historicalCompleted: true,
  visitStatus: 'available',
  courses: [
    {
      id: 'course-1',
      name: 'Découverte',
      entries: [
        { id: 'entry-1', title: 'Contenu 1', historicalCompleted: true },
        { id: 'entry-2', title: 'Contenu 2', historicalCompleted: true },
      ],
    },
  ],
};

function summary(overrides: Partial<SummarySpec> = {}): ApiPortalLearningPathSummary {
  return buildExecutionSummary({ modules: [LOOPED_MODULE], ...overrides });
}

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={client}>
      <FormationPlayer enrollmentId={ENROLLMENT_ID} />
    </QueryClientProvider>,
  );

  return { ...view, user: userEvent.setup() };
}

describe('Pilotage par le moteur d’exécution', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    window.localStorage.clear();
    mockRecordTime.mockResolvedValue(undefined);
    useSummary(summary());
    mockGetEntry.mockImplementation(async (_enrollmentId, _courseId, entryId) => ({
      data: {
        id: entryId,
        content_type_id: 'type-page',
        module_type: 'page',
        data: { body: `Texte de ${entryId}` },
        field_types: { body: 'textarea' },
        is_published: true,
      },
    }));
    const started = summary({
      stateRevision: 8,
      modules: [{ ...LOOPED_MODULE, visitStatus: 'in_progress' }],
    });
    mockStart.mockImplementation(async () => {
      useSummary(started);
      return { data: started.execution };
    });
    mockComplete.mockResolvedValue({ data: started.execution });
  });

  afterEach(() => jest.restoreAllMocks());

  it('attend les commits SCORM avant de terminer, sans nouvelle écriture au démontage', async () => {
    const tracking = configureScorm();
    let acknowledge!: (value: { data: ApiScormTrackingState }) => void;
    mockScorm.commitTracking.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          acknowledge = resolve;
        }),
    );
    mockScorm.commitTracking.mockResolvedValue({ data: { ...tracking, last_sequence: 2 } });
    const { user, unmount } = setup();
    await screen.findByRole('button', { name: 'Afficher en plein écran' });
    const api = scormWindowApi();
    act(() => {
      api.LMSSetValue('cmi.suspend_data', 'loading');
      api.LMSCommit();
    });
    await waitFor(() => expect(mockScorm.commitTracking).toHaveBeenCalledTimes(1));
    api.LMSSetValue('cmi.suspend_data', 'latest');
    await user.click(screen.getByRole('button', { name: 'Terminer' }));
    expect(mockComplete).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Terminer' })).toBeDisabled();
    expect(api.LMSSetValue('cmi.suspend_data', 'late')).toBe('false');
    await act(async () => {
      acknowledge({ data: { ...tracking, last_sequence: 1 } });
    });
    await waitFor(() => expect(mockComplete).toHaveBeenCalledTimes(1));
    expect(mockScorm.commitTracking).toHaveBeenCalledTimes(2);
    expect(mockScorm.commitTracking.mock.calls[1][1].cmi_data).toEqual({
      'cmi.suspend_data': 'latest',
    });
    expect(mockScorm.commitTracking.mock.invocationCallOrder[1]).toBeLessThan(
      mockComplete.mock.invocationCallOrder[0],
    );
    unmount();
    await act(async () => {
      api.LMSFinish();
      api.LMSCommit();
    });
    expect(mockScorm.commitTracking).toHaveBeenCalledTimes(2);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('annule la complétion si le tracking SCORM ne peut pas être sauvegardé puis autorise une reprise', async () => {
    const tracking = configureScorm();
    mockScorm.commitTracking.mockRejectedValueOnce(new Error('offline'));
    const { user } = setup();
    await screen.findByRole('button', { name: 'Afficher en plein écran' });
    const api = scormWindowApi();
    api.LMSSetValue('cmi.suspend_data', 'progress');
    await user.click(screen.getByRole('button', { name: 'Terminer' }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Impossible de sauvegarder le contenu SCORM. Veuillez réessayer.',
      ),
    );
    expect(mockComplete).not.toHaveBeenCalled();
    expect(api.LMSSetValue('cmi.suspend_data', 'resumed')).toBe('true');
    mockScorm.commitTracking.mockResolvedValue({ data: { ...tracking, last_sequence: 1 } });
    await user.click(screen.getByRole('button', { name: 'Terminer' }));
    await waitFor(() => expect(mockComplete).toHaveBeenCalledTimes(1));
    expect(mockScorm.commitTracking.mock.calls[1][1].cmi_data).toEqual({
      'cmi.suspend_data': 'resumed',
    });
  });

  it('conserve la complétion automatique SCORM sans doublon ni interblocage', async () => {
    const tracking = configureScorm();
    mockScorm.commitTracking.mockResolvedValue({
      data: { ...tracking, lesson_status: 'completed', last_sequence: 1 },
    });
    const { unmount } = setup();
    await screen.findByRole('button', { name: 'Afficher en plein écran' });
    const api = scormWindowApi();
    act(() => {
      api.LMSSetValue('cmi.core.lesson_status', 'completed');
      api.LMSCommit();
    });
    await waitFor(() => expect(mockComplete).toHaveBeenCalledTimes(1));
    unmount();
    await act(async () => {
      api.LMSFinish();
    });
    expect(mockScorm.commitTracking).toHaveBeenCalledTimes(1);
  });

  it('fige aussi un SCORM dont le lancement arrive après le clic sur Terminer', async () => {
    configureScorm();
    const launch = await mockScorm.launch({
      enrollmentId: ENROLLMENT_ID,
      competencyId: 'module-1',
      courseId: 'course-1',
      entryId: 'entry-1',
      nodeExecutionId: 'exec-module-1',
    });
    let acknowledgeLaunch!: (value: typeof launch) => void;
    mockScorm.launch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          acknowledgeLaunch = resolve;
        }),
    );
    let acknowledgeCompletion!: () => void;
    const complete = mockComplete.getMockImplementation()!;
    mockComplete.mockImplementationOnce(async (...args) => {
      await new Promise<void>((resolve) => {
        acknowledgeCompletion = resolve;
      });
      return complete(...args);
    });
    const { user, unmount } = setup();
    await user.click(await screen.findByRole('button', { name: 'Terminer' }));
    await waitFor(() => expect(mockComplete).toHaveBeenCalledTimes(1));
    await act(async () => {
      acknowledgeLaunch(launch);
    });
    await screen.findByRole('button', { name: 'Afficher en plein écran' });
    const api = scormWindowApi();
    expect(api.LMSSetValue('cmi.suspend_data', 'late')).toBe('false');
    await act(async () => {
      api.LMSCommit();
      acknowledgeCompletion();
    });
    unmount();
    expect(mockScorm.commitTracking).not.toHaveBeenCalled();
  });

  it('réactive le runtime si la complétion échoue après la sauvegarde SCORM', async () => {
    const tracking = configureScorm();
    mockScorm.commitTracking.mockResolvedValue({ data: { ...tracking, last_sequence: 1 } });
    mockComplete.mockRejectedValueOnce(new Error('offline'));
    const { user } = setup();
    await screen.findByRole('button', { name: 'Afficher en plein écran' });
    const api = scormWindowApi();
    api.LMSSetValue('cmi.suspend_data', 'progress');
    await user.click(screen.getByRole('button', { name: 'Terminer' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Terminer' })).toBeEnabled());
    expect(mockComplete).toHaveBeenCalledTimes(1);
    expect(api.LMSSetValue('cmi.suspend_data', 'resumed')).toBe('true');
  });

  it('attend la confirmation de /start avant de compter le temps ou proposer la complétion', async () => {
    const clock = jest.spyOn(performance, 'now').mockReturnValue(0);
    let acknowledgeStart!: () => void;
    mockStart.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          acknowledgeStart = () => {
            const started = summary({
              stateRevision: 8,
              modules: [{ ...LOOPED_MODULE, visitStatus: 'in_progress' }],
            });
            useSummary(started);
            resolve({ data: started.execution });
          };
        }),
    );
    const { user, unmount } = setup();
    await screen.findByText('Texte de entry-1');
    await waitFor(() => expect(mockStart).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('button', { name: /Terminer/ })).not.toBeInTheDocument();
    clock.mockReturnValue(10_000);
    await act(async () => {
      window.dispatchEvent(new Event('pagehide'));
    });
    expect(mockRecordTime).not.toHaveBeenCalled();
    expect(mockComplete).not.toHaveBeenCalled();

    await act(async () => {
      acknowledgeStart();
    });
    const complete = await screen.findByRole('button', { name: 'Terminer et continuer' });
    clock.mockReturnValue(15_000);
    await user.click(complete);
    await waitFor(() => expect(mockComplete).toHaveBeenCalledTimes(1));
    expect(mockRecordTime.mock.calls[0][4]).toMatchObject({
      node_execution_id: 'exec-module-1',
      expected_state_revision: 8,
      time_spent: 5,
    });
    unmount();
  });

  it('recharge silencieusement le parcours après un conflit du suivi de temps automatique', async () => {
    const clock = jest.spyOn(performance, 'now').mockReturnValue(0);
    const { unmount } = setup();
    await screen.findByRole('button', { name: 'Terminer et continuer' });
    const callsBefore = mockSummary.mock.calls.length;
    mockRecordTime.mockRejectedValueOnce(executionConflict());
    clock.mockReturnValue(10_000);
    await act(async () => {
      window.dispatchEvent(new Event('pagehide'));
    });
    await waitFor(() => expect(mockSummary.mock.calls.length).toBeGreaterThan(callsBefore));
    expect(window.localStorage.getItem('learneo:content-time:pending')).toBeNull();
    expect(toast.error).not.toHaveBeenCalled();
    expect(mockComplete).not.toHaveBeenCalled();
    unmount();
  });

  it('démarre la visite désignée par le serveur avec la révision lue', async () => {
    setup();
    await screen.findByText('Texte de entry-1');

    await waitFor(() => expect(mockStart).toHaveBeenCalledTimes(1));
    expect(mockStart).toHaveBeenCalledWith(ENROLLMENT_ID, 'exec-module-1', 7);
  });

  it('ne redémarre pas la même visite après un rechargement du résumé', async () => {
    const { user } = setup();
    await screen.findByText('Texte de entry-1');
    await waitFor(() => expect(mockStart).toHaveBeenCalledTimes(1));

    // La complétion invalide le résumé : le snapshot revient identique, et un
    // second démarrage serait refusé en 409.
    await user.click(screen.getByRole('button', { name: 'Terminer et continuer' }));
    await waitFor(() => expect(mockComplete).toHaveBeenCalled());

    expect(mockStart).toHaveBeenCalledTimes(1);
  });

  it('joint la visite du module et la révision à la complétion de contenu', async () => {
    const { user } = setup();
    await screen.findByText('Texte de entry-1');

    await user.click(screen.getByRole('button', { name: 'Terminer et continuer' }));

    await waitFor(() =>
      expect(mockComplete).toHaveBeenCalledWith(ENROLLMENT_ID, 'module-1', 'course-1', 'entry-1', {
        node_execution_id: 'exec-module-1',
        expected_state_revision: 8,
      }),
    );
  });

  it('recharge l’état serveur au lieu d’inviter à réessayer après un 409', async () => {
    mockComplete.mockRejectedValue(executionConflict());
    const { user } = setup();
    await screen.findByText('Texte de entry-1');
    const callsBefore = mockSummary.mock.calls.length;

    await user.click(screen.getByRole('button', { name: 'Terminer et continuer' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Votre parcours a changé entre-temps. L’état a été actualisé.',
      ),
    );
    // La mutation est abandonnée, jamais rejouée sur la visite courante.
    expect(mockComplete).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(mockSummary.mock.calls.length).toBeGreaterThan(callsBefore));
  });

  it.each([
    ['failed', 'Parcours en échec', 'Vous avez épuisé les tentatives autorisées'],
    ['completed', 'Parcours terminé', 'Votre historique reste consultable'],
    ['expired', 'Inscription expirée', 'La période d’accès est terminée'],
  ] as const)(
    'explique l’état terminal %s et retire toute action de progression',
    async (status, title, reason) => {
      useSummary(
        summary({
          status,
          currentExecution: null,
          modules: [{ ...LOOPED_MODULE, actionable: false }],
        }),
      );
      setup();

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(title);
      expect(alert).toHaveTextContent(reason);
      expect(screen.queryByText('Nouveau passage requis')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Terminer/ })).not.toBeInTheDocument();
      expect(mockStart).not.toHaveBeenCalled();
      expect(mockComplete).not.toHaveBeenCalled();
      expect(mockRecordTime).not.toHaveBeenCalled();
    },
  );

  it.each([0, 1])(
    'annonce l’échec de la formation après actualisation, même avec %i tentative restante',
    async (remainingAttempts) => {
      const evaluation = {
        id: 'evaluation-1',
        title: 'Évaluation finale',
        actionable: true,
        minScorePercentage: 50,
        remainingAttempts: 2,
      };
      useSummary(summary({ modules: [], finalEvaluations: [evaluation] }));
      const { user } = setup();
      const submit = await screen.findByRole('button', { name: 'Soumettre l’évaluation' });

      let resolveSummary!: (value: { data: ApiPortalLearningPathSummary }) => void;
      mockSummary.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveSummary = resolve;
          }),
      );
      await user.click(submit);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      await act(async () => {
        resolveSummary({
          data: summary({
            status: 'failed',
            currentExecution: null,
            stateRevision: 8,
            modules: [],
            finalEvaluations: [{ ...evaluation, actionable: false, remainingAttempts }],
          }),
        });
      });

      const dialog = within(await screen.findByRole('dialog', { name: 'Formation non validée' }));
      expect(
        dialog.getByText('Vous avez échoué à cette formation. Votre parcours est terminé.'),
      ).toBeInTheDocument();
      expect(
        dialog.queryByText(/tentative|Votre parcours a été mis à jour/),
      ).not.toBeInTheDocument();

      await user.click(dialog.getByRole('button', { name: 'Fermer' }));
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent('Parcours en échec');
      expect(
        screen.getByRole('button', { name: /Évaluation Finale Évaluation finale/i }),
      ).toBeDisabled();
      expect(screen.queryByRole('button', { name: /Soumettre|Terminer/ })).not.toBeInTheDocument();
      expect(mockStart).not.toHaveBeenCalled();
      expect(mockComplete).not.toHaveBeenCalled();
    },
  );

  it('conserve le rebouclage et affiche le budget actualisé de l’évaluation échouée', async () => {
    const evaluation = {
      id: 'evaluation-1',
      title: 'Évaluation finale',
      actionable: true,
      minScorePercentage: 50,
      remainingAttempts: 2,
    };
    useSummary(summary({ modules: [], finalEvaluations: [evaluation] }));
    const { user } = setup();
    const submit = await screen.findByRole('button', { name: 'Soumettre l’évaluation' });

    useSummary(
      summary({
        stateRevision: 8,
        modules: [{ ...LOOPED_MODULE, visitStatus: 'in_progress' }],
        finalEvaluations: [{ ...evaluation, actionable: false, remainingAttempts: 1 }],
      }),
    );
    await user.click(submit);

    const dialog = within(await screen.findByRole('dialog', { name: 'Évaluation non validée' }));
    expect(dialog.getByText(/Il vous reste/)).toHaveTextContent('Il vous reste 1 tentative.');
    expect(dialog.getByText('Les bases')).toBeInTheDocument();
    expect(dialog.queryByText(/Vous avez échoué à cette formation/)).not.toBeInTheDocument();

    await user.click(dialog.getByRole('button', { name: 'Revoir le module' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await screen.findByText('Texte de entry-1');
  });

  it('explique l’obligation de terminer à nouveau les contenus historiques', async () => {
    setup();

    expect(await screen.findByRole('button', { name: 'Terminer et continuer' })).toBeEnabled();
    expect(screen.getByText('Texte de entry-1')).toBeInTheDocument();
    expect(mockStart).toHaveBeenCalledWith(ENROLLMENT_ID, 'exec-module-1', 7);
    expect(mockComplete).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Nouveau passage requis');
    expect(screen.getByRole('alert')).toHaveTextContent('il doit être refait pour continuer');
    expect(screen.queryByText(/Progression du parcours en cours/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Couverture historique/)).not.toBeInTheDocument();
  });

  it('laisse consulter les contenus terminés sans nouvelle écriture', async () => {
    useSummary(
      summary({
        modules: [
          {
            ...LOOPED_MODULE,
            actionable: false,
            requiredToRepeat: false,
            visitStatus: 'completed',
            courses: LOOPED_MODULE.courses.map((course) => ({
              ...course,
              entries: course.entries.map((entry) => ({ ...entry, completed: true })),
            })),
          },
        ],
        currentExecution: null,
      }),
    );
    setup();
    await screen.findByText('Texte de entry-2');

    expect(screen.queryByRole('button', { name: /Terminer/ })).not.toBeInTheDocument();
    expect(mockComplete).not.toHaveBeenCalled();
    expect(mockRecordTime).not.toHaveBeenCalled();
  });
});
