import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import {
  evaluationAttemptsApi,
  portalContentEntriesApi,
  portalContentTimeApi,
  portalLearningPathsApi,
} from '@/shared/api/portal.api';
import { progressionApi } from '@/shared/api/progression.api';
import { portalVideoApi, type VideoProgress } from '@/shared/api/portal-video.api';
import {
  portalScormApi,
  type ApiScormLaunch,
  type ApiScormTrackingState,
} from '@/shared/api/portal-scorm.api';
import { Role } from '@/shared/constants/roles';
import { portalLearningPathKeys, portalMyEnrollmentsKeys } from '@/shared/queries/keys';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useTenantStore } from '@/shared/stores/tenant.store';
import { useSimulationStore } from '@/shared/simulation/simulation.store';
import type {
  ApiPortalContentEntry,
  ApiPortalLearningPathSummary,
} from '@/shared/types/portal.types';
import type { Formation } from '../lib/types';
import FormationPlayer from '../FormationPlayer';
import { resetEvaluationIdentity } from '../lib/__fixtures__/evaluation-identity';
import { evaluationAttempt } from '../lib/__fixtures__/evaluation-attempt';
import { evaluationDocument } from '../lib/evaluation-document-session';
import {
  ENROLLMENT_ID,
  buildExecutionSummary,
  visit,
  type ModuleSpec,
} from '../lib/__fixtures__/execution-summary';

jest.mock('@/shared/api/portal.api', () => ({
  portalLearningPathsApi: { summary: jest.fn(), learnerEvaluations: jest.fn() },
  portalContentEntriesApi: { get: jest.fn(), markComplete: jest.fn() },
  portalContentTimeApi: { record: jest.fn() },
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
jest.mock('@/shared/api/portal-video.api', () => ({
  portalVideoApi: { get: jest.fn(), save: jest.fn() },
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

const mockSummary = jest.mocked(portalLearningPathsApi.summary);
const mockGetEntry = jest.mocked(portalContentEntriesApi.get);
const mockComplete = jest.mocked(portalContentEntriesApi.markComplete);
const mockRecordTime = jest.mocked(portalContentTimeApi.record);

/**
 * Un même cours atteint depuis deux modules : les preuves, la navigation et les
 * visites doivent rester indépendantes d'une occurrence à l'autre.
 */
function sharedCourseModules(entryCount = 2): ModuleSpec[] {
  const entries = Array.from({ length: entryCount }, (_, index) => ({
    id: `shared-entry-${index + 1}`,
    title: `Contenu partagé ${index + 1}`,
  }));

  return [
    {
      id: 'module-1',
      name: 'Les bases',
      courses: [{ id: 'shared-course', name: 'Cours partagé', entries }],
    },
    {
      id: 'module-2',
      name: 'La suite',
      // Seule la première visite est ouverte : le moteur n'autorise qu'un nœud.
      actionable: false,
      courses: [{ id: 'shared-course', name: 'Cours partagé', entries }],
    },
  ];
}

let summary: ApiPortalLearningPathSummary;

function useSummary(modules: ModuleSpec[]) {
  summary = buildExecutionSummary({ modules });
}

/** Rejoue la réponse serveur : la preuve est portée par la visite du module. */
function completeEntry(entryId: string, competencyId: string) {
  const module = summary.modules.find((candidate) => candidate.id === competencyId);
  if (!module) return;
  for (const course of module.courses) {
    for (const section of course.sections) {
      for (const entry of section.content_entries) {
        if (entry.id === entryId) entry.completed = true;
      }
    }
  }
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
  return { ...view, client, user: userEvent.setup() };
}

describe('Parcours du stagiaire piloté par le snapshot d’exécution', () => {
  const initialAuth = useAuthStore.getState();
  const initialTenant = useTenantStore.getState();
  const initialSimulation = useSimulationStore.getState();

  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(evaluationAttemptsApi.session).mockResolvedValue({ data: null });
    window.localStorage.clear();
    resetEvaluationIdentity();
    delete window.__learneoEvaluationDocument;
    mockRecordTime.mockResolvedValue(undefined);
    useSummary(sharedCourseModules());
    mockSummary.mockImplementation(async () => ({ data: summary }));
    jest.mocked(portalLearningPathsApi.learnerEvaluations).mockResolvedValue({ data: [] });
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
    mockComplete.mockImplementation(async (_enrollmentId, competencyId, _courseId, entryId) => {
      completeEntry(entryId, competencyId);
      return { data: summary.execution };
    });
  });

  afterEach(() => {
    cleanup();
    useAuthStore.setState(initialAuth);
    useTenantStore.setState(initialTenant);
    useSimulationStore.setState(initialSimulation);
    delete window.__learneoEvaluationDocument;
    jest.restoreAllMocks();
  });

  it('attend l’acquittement du temps avant d’envoyer la complétion manuelle', async () => {
    const clock = jest.spyOn(performance, 'now').mockReturnValue(0);
    const { user } = setup();
    await screen.findByText('Texte de shared-entry-1');
    clock.mockReturnValue(10_000);
    let acknowledge!: () => void;
    mockRecordTime.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          acknowledge = resolve;
        }),
    );

    await user.click(screen.getByRole('button', { name: 'Terminer et continuer' }));
    await waitFor(() => expect(mockRecordTime).toHaveBeenCalledTimes(1));
    expect(mockComplete).not.toHaveBeenCalled();
    expect(mockRecordTime.mock.calls[0][4]).toMatchObject({
      time_spent: 10,
      node_execution_id: 'exec-module-1',
      expected_state_revision: 7,
    });
    expect(screen.getByRole('button', { name: 'Terminer et continuer' })).toBeDisabled();
    await act(async () => {
      acknowledge();
    });
    await waitFor(() => expect(mockComplete).toHaveBeenCalledTimes(1));
  });

  it('ne ferme pas la visite si le temps échoue et permet de réessayer', async () => {
    const clock = jest.spyOn(performance, 'now').mockReturnValue(0);
    const { user } = setup();
    await screen.findByText('Texte de shared-entry-1');
    clock.mockReturnValue(10_000);
    mockRecordTime.mockRejectedValueOnce(new Error('network'));
    await user.click(screen.getByRole('button', { name: 'Terminer et continuer' }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Impossible de sauvegarder le temps de consultation. Veuillez réessayer.',
      ),
    );
    expect(mockComplete).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Terminer et continuer' }));
    await waitFor(() => expect(mockComplete).toHaveBeenCalledTimes(1));
    expect(mockRecordTime.mock.calls[1][3]).toBe(mockRecordTime.mock.calls[0][3]);
  });

  it('adresse chaque validation à la visite du module consulté', async () => {
    const { user } = setup();
    await screen.findByText('Texte de shared-entry-1');

    await user.click(screen.getByRole('button', { name: 'Terminer et continuer' }));
    await screen.findByText('Texte de shared-entry-2');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Terminer et continuer' })).toBeEnabled(),
    );
    await user.click(screen.getByRole('button', { name: 'Terminer et continuer' }));

    await waitFor(() => expect(mockComplete).toHaveBeenCalledTimes(2));
    expect(mockComplete.mock.calls).toEqual([
      [
        ENROLLMENT_ID,
        'module-1',
        'shared-course',
        'shared-entry-1',
        { node_execution_id: 'exec-module-1', expected_state_revision: 7 },
      ],
      [
        ENROLLMENT_ID,
        'module-1',
        'shared-course',
        'shared-entry-2',
        { node_execution_id: 'exec-module-1', expected_state_revision: 7 },
      ],
    ]);
    // GET still uses the raw UUID, never the module-scoped navigation identity.
    expect(mockGetEntry.mock.calls.map((call) => call[2])).toEqual([
      'shared-entry-1',
      'shared-entry-2',
    ]);
  });

  it.each([false, true])(
    'verrouille le module suivant, même déjà parcouru (repassage=%s)',
    async (repeat) => {
      const [first, second] = sharedCourseModules();
      useSummary([first, { ...second, requiredToRepeat: repeat, historicalCompleted: repeat }]);
      const { user } = setup();
      await screen.findByText('Texte de shared-entry-1');

      const nextModule = screen.getByRole('button', { name: /la suite/i });
      expect(nextModule).toBeDisabled();
      await user.click(nextModule);
      expect(screen.getByText('Contenu 1 / 4')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Contenu partagé 2' })).toBeDisabled();

      expect(mockComplete).not.toHaveBeenCalled();
    },
  );

  it('valide la seconde occurrence une fois la visite du module suivant ouverte', async () => {
    // Le serveur a transféré la visite courante au second module.
    const [first, second] = sharedCourseModules();
    useSummary([
      { ...first, actionable: false },
      { ...second, actionable: true },
    ]);
    const { user } = setup();
    await screen.findByText('Contenu 3 / 4');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Terminer et continuer' })).toBeEnabled(),
    );

    await user.click(screen.getByRole('button', { name: 'Terminer et continuer' }));

    await waitFor(() => expect(mockComplete).toHaveBeenCalledTimes(1));
    expect(mockComplete).toHaveBeenCalledWith(
      ENROLLMENT_ID,
      'module-2',
      'shared-course',
      'shared-entry-1',
      { node_execution_id: 'exec-module-2', expected_state_revision: 7 },
    );
  });

  it('attend le résumé actualisé avant de charger le contenu suivant', async () => {
    let finishSave!: () => void;
    let finishRefresh!: () => void;
    mockComplete.mockImplementation(
      () =>
        new Promise((resolve) => {
          finishSave = () => {
            completeEntry('shared-entry-1', 'module-1');
            resolve({ data: summary.execution });
          };
        }),
    );
    const { user } = setup();
    await screen.findByText('Texte de shared-entry-1');
    mockSummary.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishRefresh = () => resolve({ data: summary });
        }),
    );

    await user.click(screen.getByRole('button', { name: 'Terminer et continuer' }));
    expect(screen.getByRole('button', { name: 'Terminer et continuer' })).toBeDisabled();

    await act(async () => finishSave());
    await waitFor(() => expect(mockSummary).toHaveBeenCalledTimes(2));
    expect(mockGetEntry).toHaveBeenCalledTimes(1);

    await act(async () => finishRefresh());
    await screen.findByText('Texte de shared-entry-2');
  });

  it('conserve l’état si la sauvegarde échoue et permet de réessayer', async () => {
    mockComplete.mockRejectedValueOnce(new Error('Échec réseau'));
    const { user } = setup();
    await screen.findByText('Texte de shared-entry-1');
    await user.click(screen.getByRole('button', { name: 'Terminer et continuer' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.getByText('Texte de shared-entry-1')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Terminer et continuer' })).toBeEnabled(),
    );

    await user.click(screen.getByRole('button', { name: 'Terminer et continuer' }));
    await screen.findByText('Texte de shared-entry-2');
    expect(mockComplete).toHaveBeenCalledTimes(2);
  });

  it('verrouille aussi le module suivant dans le tiroir mobile', async () => {
    const { user } = setup();
    await screen.findByText('Texte de shared-entry-1');

    await user.click(screen.getByRole('button', { name: 'Ouvrir la navigation' }));
    const mobileNavigation = within(
      screen.getAllByRole('navigation', { name: 'Sommaire de la formation' })[1],
    );
    const nextModule = mobileNavigation.getByRole('button', { name: /module la suite/i });
    expect(nextModule).toBeDisabled();
    await user.click(nextModule);
    expect(mobileNavigation.getByRole('button', { name: 'Contenu partagé 2' })).toBeDisabled();

    expect(screen.getByText('Contenu 1 / 4')).toBeInTheDocument();
    expect(mockComplete).not.toHaveBeenCalled();
  });

  describe.each(['intermediate', 'final'] as const)('évaluation %s terminée', (evaluationType) => {
    it.each([0, 90, null])(
      'affiche la fin du passage en lecture seule (score=%s)',
      async (score) => {
        summary = buildExecutionSummary({
          modules: sharedCourseModules(),
          finalEvaluations: [
            {
              id: 'evaluation-1',
              title: 'Bilan des acquis',
              historicalCompleted: true,
              currentScore: score,
              remainingAttempts: 0,
              roundStatus: 'exhausted',
            },
          ],
        });
        if (evaluationType === 'intermediate') {
          summary.modules[0].evaluation = {
            ...summary.final_evaluations[0],
            evaluation_type: 'PARTIAL',
          };
          summary.final_evaluations = [];
          summary.final_evaluation = null;
        }
        const { user } = setup();
        await screen.findByText('Texte de shared-entry-1');

        await user.click(screen.getByRole('button', { name: /Bilan des acquis/ }));
        const content = within(screen.getByRole('main'));
        expect(
          await content.findByRole('heading', { name: 'Évaluation terminée' }),
        ).toBeInTheDocument();
        expect(content.getByText(/lecture seule/)).toBeInTheDocument();
        expect(
          content.queryByText(
            /Prenez quelques instants|Informations importantes|Tentatives épuisées/,
          ),
        ).not.toBeInTheDocument();
        expect(
          content.queryByRole('button', { name: /Commencer|Réessayer/ }),
        ).not.toBeInTheDocument();
        if (score !== null) {
          expect(content.getByText('Votre score').parentElement).toHaveTextContent(`${score}%`);
        } else {
          expect(content.queryByText(/Votre score/)).not.toBeInTheDocument();
        }

        // Quitter puis revenir ne doit pas réafficher le splash de démarrage.
        await user.click(screen.getByRole('button', { name: 'Contenu partagé 1' }));
        await screen.findByText('Texte de shared-entry-1');
        await user.click(screen.getByRole('button', { name: /Bilan des acquis/ }));
        expect(
          await content.findByRole('heading', { name: 'Évaluation terminée' }),
        ).toBeInTheDocument();
        expect(evaluationAttemptsApi.start).not.toHaveBeenCalled();
        expect(evaluationAttemptsApi.submit).not.toHaveBeenCalled();
        expect(progressionApi.startNodeExecution).not.toHaveBeenCalled();
      },
    );
  });

  it('affiche la fin d’une évaluation sans attendre le chargement des tentatives', async () => {
    summary = buildExecutionSummary({
      modules: [],
      finalEvaluations: [{ id: 'evaluation-1', title: 'Bilan', historicalCompleted: true }],
    });
    jest
      .mocked(portalLearningPathsApi.learnerEvaluations)
      .mockImplementation(() => new Promise(() => {}));
    setup();

    expect(await screen.findByRole('heading', { name: 'Évaluation terminée' })).toBeInTheDocument();
    expect(
      screen.queryByText(/Vérification de vos tentatives|Informations importantes/),
    ).not.toBeInTheDocument();
  });

  it.each(['manual', null] as const)(
    'acquitte un échec %s sur la même évaluation vers le splash de la nouvelle visite sans lancer de tentative',
    async (reason) => {
      const api = jest.mocked(evaluationAttemptsApi);
      const firstVisit = visit({
        id: 'visit-1',
        node_type: 'evaluation',
        node_id: 'evaluation-1',
        status: 'in_progress',
        validation_round_id: 'round-evaluation-1',
      });
      const nextVisit = visit({
        ...firstVisit,
        id: 'visit-2',
        visit_number: 2,
        status: 'available',
      });
      const makeSummary = (retry: boolean) => {
        const current = retry ? nextVisit : firstVisit;
        const value = buildExecutionSummary({
          modules: [],
          stateRevision: retry ? 4 : 1,
          currentExecution: current,
          finalEvaluations: [
            {
              id: 'evaluation-1',
              title: 'Bilan',
              actionable: true,
              requiredToRepeat: retry,
              historicalCompleted: retry,
              attemptsUsed: retry ? 1 : 0,
              remainingAttempts: retry ? 2 : 3,
            },
          ],
        });
        value.final_evaluations[0].current_execution = current;
        return value;
      };
      summary = makeSummary(false);
      api.start.mockImplementation(async (_enrollment, _evaluation, context) => ({
        data: evaluationAttempt({
          id: context.node_execution_id === 'visit-1' ? 'attempt-1' : 'attempt-2',
          node_execution_id: context.node_execution_id,
          page_session_id: context.page_session_id,
          validation_round_id: 'round-evaluation-1',
        }),
      }));
      api.answer.mockResolvedValue({ data: evaluationAttempt() });
      api.get.mockResolvedValue({ data: evaluationAttempt() });
      api.submit.mockImplementation(async () => {
        summary = makeSummary(true);
        return {
          data: evaluationAttempt({ status: 'completed', score: 25, completion_reason: reason }),
          execution: summary.execution,
        };
      });
      // The player's existing node-start flow does not create an evaluation attempt.
      jest.mocked(progressionApi.startNodeExecution).mockImplementation(async () => {
        const started = { ...nextVisit, status: 'in_progress' as const };
        summary = makeSummary(true);
        summary.final_evaluations[0].current_execution = started;
        summary.execution = { ...summary.execution, current_execution: started, state_revision: 5 };
        return { data: summary.execution };
      });
      const { user, client } = setup();
      await user.click(await screen.findByRole('button', { name: "Commencer l'évaluation" }));
      await user.click(await screen.findByRole('checkbox', { name: /Option A/ }));
      await screen.findByText('Réponse enregistrée');
      await user.click(screen.getByRole('button', { name: 'Terminer le quiz' }));
      await user.click(screen.getByRole('button', { name: 'Soumettre le quiz' }));
      const dialog = await screen.findByRole('dialog', { name: 'Évaluation non validée' });
      await waitFor(() =>
        expect(api.session).toHaveBeenLastCalledWith(ENROLLMENT_ID, 'evaluation-1', {
          node_execution_id: 'visit-2',
          page_session_id: evaluationDocument().id,
        }),
      );
      await waitFor(() =>
        expect(client.getQueryData(portalLearningPathKeys.summary(ENROLLMENT_ID))).toMatchObject({
          execution: { stateRevision: 5 },
        }),
      );
      expect(screen.getByText("Résultat de l'évaluation")).toBeInTheDocument();
      expect(api.start).toHaveBeenCalledTimes(1);
      await user.click(within(dialog).getByRole('button', { name: 'Repasser l’évaluation' }));
      const startButton = await screen.findByRole('button', { name: "Commencer l'évaluation" });
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByText("Résultat de l'évaluation")).not.toBeInTheDocument();
      expect(api.start).toHaveBeenCalledTimes(1);
      await user.click(startButton);
      await screen.findByRole('main', { name: 'Examen : Bilan' });
      expect(api.start).toHaveBeenLastCalledWith(ENROLLMENT_ID, 'evaluation-1', {
        node_execution_id: 'visit-2',
        expected_state_revision: 5,
        page_session_id: evaluationDocument().id,
      });
      expect(screen.getByRole('checkbox', { name: /Option A/ })).not.toBeChecked();
      expect(api.submit).toHaveBeenCalledTimes(1);
    },
  );

  it('conserve l’écran de démarrage pour une évaluation déjà passée mais à refaire', async () => {
    summary = buildExecutionSummary({
      modules: [],
      finalEvaluations: [
        {
          id: 'evaluation-1',
          title: 'Bilan',
          actionable: true,
          requiredToRepeat: true,
          historicalCompleted: true,
          remainingAttempts: 1,
        },
      ],
    });
    setup();

    expect(await screen.findByRole('button', { name: /Commencer l'évaluation/ })).toBeEnabled();
    expect(screen.getByText('Informations importantes')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Évaluation terminée' })).not.toBeInTheDocument();
    expect(evaluationAttemptsApi.start).not.toHaveBeenCalled();
  });

  it('attribue la validation SCORM au module consulté avec un runtime propre à la visite', async () => {
    const clock = jest.spyOn(performance, 'now').mockReturnValue(0);
    useSummary(sharedCourseModules(1));
    mockGetEntry.mockResolvedValue({
      data: {
        id: 'shared-entry-1',
        content_type_id: 'type-scorm',
        module_type: 'scorm',
        data: { scorm_package_id: 'package-1' },
        field_types: {},
        is_published: true,
      },
    });
    const tracking: ApiScormTrackingState = {
      enrollment_id: ENROLLMENT_ID,
      competency_id: 'module-1',
      content_entry_id: 'shared-entry-1',
      node_execution_id: 'exec-module-1',
      lesson_status: 'incomplete',
      score_raw: null,
      score_min: null,
      score_max: null,
      session_time: 0,
      total_time: 0,
      cmi_data: {},
      last_commit_id: null,
      last_sequence: 0,
      updated_at: null,
    };
    jest.mocked(portalScormApi.launch).mockResolvedValue({
      data: {
        enrollment_id: ENROLLMENT_ID,
        competency_id: 'module-1',
        content_entry_id: 'shared-entry-1',
        node_execution_id: 'exec-module-1',
        scorm_package_id: 'package-1',
        version: '1.2',
        launch_path: 'index.html',
        launch_url: 'about:blank',
      },
    });
    jest.mocked(portalScormApi.getTracking).mockResolvedValue({ data: tracking });
    jest.mocked(portalScormApi.commitTracking).mockResolvedValue({
      data: { ...tracking, lesson_status: 'completed', last_sequence: 1 },
    });

    setup();
    await screen.findByRole('button', { name: 'Afficher en plein écran' });
    clock.mockReturnValue(10_000);
    let acknowledgeTime!: () => void;
    mockRecordTime.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          acknowledgeTime = resolve;
        }),
    );

    const scormApi = (
      window as unknown as {
        API: { LMSSetValue: (key: string, value: string) => string; LMSCommit: () => string };
      }
    ).API;
    await act(async () => {
      scormApi.LMSSetValue('cmi.core.lesson_status', 'completed');
      scormApi.LMSCommit();
    });

    await waitFor(() => expect(mockRecordTime).toHaveBeenCalledTimes(1));
    expect(mockComplete).not.toHaveBeenCalled();
    await act(async () => {
      acknowledgeTime();
    });
    await waitFor(() => expect(mockComplete).toHaveBeenCalledTimes(1));
    expect(mockComplete).toHaveBeenCalledWith(
      ENROLLMENT_ID,
      'module-1',
      'shared-course',
      'shared-entry-1',
      { node_execution_id: 'exec-module-1', expected_state_revision: 7 },
    );
    // Le runtime est ouvert sur la visite courante, jamais sur un ancien passage.
    expect(jest.mocked(portalScormApi.getTracking)).toHaveBeenCalledWith(
      expect.objectContaining({ nodeExecutionId: 'exec-module-1' }),
    );
  });

  it('laisse consulter un SCORM terminé sans obligation de rejouer, sans écriture ni nouveau temps', async () => {
    const [first, second] = sharedCourseModules(1);
    useSummary([
      first,
      {
        ...second,
        executionId: null,
        historicalCompleted: true,
        courses: second.courses.map((course) => ({
          ...course,
          entries: course.entries.map((entry) => ({
            ...entry,
            completed: true,
            historicalCompleted: true,
          })),
        })),
      },
    ]);
    summary.modules[1].history = [
      visit({ id: 'old-module-2', node_id: 'module-2', status: 'completed' }),
    ];
    mockGetEntry.mockResolvedValue({
      data: {
        id: 'shared-entry-1',
        content_type_id: 'type-scorm',
        module_type: 'scorm',
        data: { scorm_package_id: 'package-1' },
        field_types: {},
        is_published: true,
      },
    });
    jest.mocked(portalScormApi.launch).mockImplementation(async (context) => ({
      data: {
        enrollment_id: ENROLLMENT_ID,
        competency_id: context.competencyId,
        content_entry_id: context.entryId,
        node_execution_id: context.nodeExecutionId,
        scorm_package_id: 'package-1',
        version: '1.2',
        launch_path: 'index.html',
        launch_url: 'about:blank',
      },
    }));
    jest.mocked(portalScormApi.getTracking).mockImplementation(async (context) => ({
      data: {
        enrollment_id: ENROLLMENT_ID,
        competency_id: context.competencyId,
        content_entry_id: context.entryId,
        node_execution_id: context.nodeExecutionId,
        lesson_status: 'completed',
        score_raw: 100,
        score_min: 0,
        score_max: 100,
        session_time: 10,
        total_time: 10,
        cmi_data: {},
        last_commit_id: null,
        last_sequence: 1,
        updated_at: null,
      },
    }));
    const clock = jest.spyOn(performance, 'now').mockReturnValue(0);
    const { user, unmount } = setup();
    await screen.findByRole('button', { name: 'Afficher en plein écran' });
    await user.click(screen.getAllByRole('button', { name: 'Contenu partagé 1' })[1]);
    await screen.findByText('Contenu 2 / 2');
    await screen.findByRole('button', { name: 'Afficher en plein écran' });
    expect(portalScormApi.launch).toHaveBeenLastCalledWith(
      expect.objectContaining({
        competencyId: 'module-2',
        nodeExecutionId: 'old-module-2',
      }),
    );
    const api = (
      window as unknown as {
        API: {
          LMSGetValue: (key: string) => string;
          LMSSetValue: (key: string, value: string) => string;
          LMSCommit: () => string;
        };
      }
    ).API;
    expect(api.LMSGetValue('cmi.core.lesson_mode')).toBe('review');
    clock.mockReturnValue(10_000);
    await act(async () => {
      api.LMSSetValue('cmi.core.lesson_status', 'completed');
      api.LMSCommit();
    });
    unmount();
    expect(portalScormApi.commitTracking).not.toHaveBeenCalled();
    expect(mockComplete).not.toHaveBeenCalled();
    expect(mockRecordTime).not.toHaveBeenCalled();
  });

  it('ne démarre pas de visite quand le serveur n’en propose aucune', async () => {
    setup();
    await screen.findByText('Texte de shared-entry-1');

    // La visite courante est déjà `in_progress` : rien à démarrer.
    expect(jest.mocked(progressionApi.startNodeExecution)).not.toHaveBeenCalled();
  });

  describe('progression des vidéos natives', () => {
    const initialAuth = useAuthStore.getState();
    const initialSimulation = useSimulationStore.getState();
    const empty: VideoProgress = {
      node_id: 'module-1',
      node_execution_id: 'exec-module-1',
      position: 0,
      duration: 600,
      watched_ranges: [],
      watched_seconds: 0,
      version: 0,
      last_commit_id: null,
    };

    beforeEach(() => {
      useAuthStore.setState({
        user: { id: 'learner', name: 'Learner', email: 'learner@example.test', role: Role.TRAINEE },
        sessionId: 'video-session',
        simulatedRole: null,
      });
      useSimulationStore.setState({ phase: 'idle', epoch: 0 });
      jest.mocked(portalVideoApi.get).mockResolvedValue(empty);
      jest.mocked(portalVideoApi.save).mockImplementation(async (_context, payload) => ({
        ...empty,
        ...payload,
        version: payload.version + 1,
        last_commit_id: payload.commit_id,
      }));
      mockGetEntry.mockImplementation(async (_enrollment, _course, entryId) => ({
        data: {
          id: entryId,
          content_type_id: 'type-media',
          module_type: 'media',
          is_published: true,
          field_types: { files: 'media' },
          data: {
            files: ['video-1', 'video-2'].map((id) => ({
              id,
              url: `/${id}.mp4`,
              mime_type: 'video/mp4',
            })),
          },
        },
      }));
    });

    afterEach(() => {
      cleanup();
      useAuthStore.setState(initialAuth);
      useSimulationStore.setState(initialSimulation);
    });

    async function startVideos() {
      const clock = jest.spyOn(performance, 'now').mockReturnValue(0);
      const view = setup();
      const videos = await screen.findAllByLabelText<HTMLVideoElement>('Vidéo de formation');
      await waitFor(() => expect(portalVideoApi.get).toHaveBeenCalledTimes(2));
      for (const video of videos) {
        Object.defineProperties(video, {
          duration: { configurable: true, value: 600 },
          readyState: { configurable: true, value: 4 },
          paused: { configurable: true, writable: true, value: false },
        });
        video.pause = jest.fn(() => {
          Object.assign(video, { paused: true });
          fireEvent.pause(video);
        });
        fireEvent.play(video);
        fireEvent.playing(video);
      }
      clock.mockReturnValue(2000);
      for (const video of videos) {
        video.currentTime = 2;
        fireEvent.timeUpdate(video);
      }
      return { ...view, videos };
    }

    it('reprend la même vidéo séparément dans le nœud actif et le nœud historique', async () => {
      const [first, second] = sharedCourseModules(1);
      useSummary([
        {
          ...first,
          actionable: false,
          visitStatus: 'completed',
          historicalCompleted: true,
          courses: first.courses.map((course) => ({
            ...course,
            entries: course.entries.map((entry) => ({
              ...entry,
              completed: true,
              historicalCompleted: true,
            })),
          })),
        },
        { ...second, actionable: true },
      ]);
      jest.mocked(portalVideoApi.get).mockImplementation(async (context) => ({
        ...empty,
        node_id: context.competencyId,
        node_execution_id: context.nodeExecutionId,
        position: context.competencyId === 'module-1' ? 270 : 30,
      }));
      const { user } = setup();
      const restoreVideos = async (position: number) => {
        const videos = await screen.findAllByLabelText<HTMLVideoElement>('Vidéo de formation');
        for (const video of videos) {
          Object.defineProperty(video, 'duration', { configurable: true, value: 600 });
          fireEvent.loadedMetadata(video);
        }
        await waitFor(() =>
          expect(videos.every((video) => video.currentTime === position)).toBe(true),
        );
        return videos;
      };
      await restoreVideos(30);
      expect(portalVideoApi.get).toHaveBeenLastCalledWith(
        expect.objectContaining({
          competencyId: 'module-2',
          nodeExecutionId: 'exec-module-2',
          entryId: 'shared-entry-1',
        }),
        expect.any(AbortSignal),
      );

      await user.click(screen.getAllByRole('button', { name: 'Contenu partagé 1' })[0]);
      const historicalVideos = await restoreVideos(270);
      expect(portalVideoApi.get).toHaveBeenLastCalledWith(
        expect.objectContaining({
          competencyId: 'module-1',
          nodeExecutionId: 'exec-module-1',
          entryId: 'shared-entry-1',
        }),
        expect.any(AbortSignal),
      );
      await act(async () => {
        historicalVideos[0].currentTime = 20;
        fireEvent.seeking(historicalVideos[0]);
        fireEvent.seeked(historicalVideos[0]);
      });
      expect(portalVideoApi.save).not.toHaveBeenCalled();
      expect(mockComplete).not.toHaveBeenCalled();

      await user.click(screen.getAllByRole('button', { name: 'Contenu partagé 1' })[1]);
      await restoreVideos(30);
    });

    it.each(['lecture', 'sauvegarde'])(
      'recharge la visite après un conflit vidéo en %s sans rejouer le signet',
      async (step) => {
        let reject!: (error: unknown) => void;
        const pending = new Promise<VideoProgress>((_resolve, fail) => {
          reject = fail;
        });
        jest.mocked(portalVideoApi.get).mockImplementation(async (context) => ({
          ...empty,
          node_execution_id: context.nodeExecutionId,
        }));
        if (step === 'lecture') jest.mocked(portalVideoApi.get).mockReturnValueOnce(pending);
        else jest.mocked(portalVideoApi.save).mockReturnValueOnce(pending);
        const { client } = setup();
        const invalidate = jest.spyOn(client, 'invalidateQueries');
        const videos = await screen.findAllByLabelText<HTMLVideoElement>('Vidéo de formation');
        await waitFor(() => expect(portalVideoApi.get).toHaveBeenCalledTimes(2));
        if (step === 'sauvegarde') {
          Object.defineProperty(videos[0], 'duration', { configurable: true, value: 600 });
          await act(async () => {
            videos[0].currentTime = 30;
            fireEvent.seeking(videos[0]);
            fireEvent.seeked(videos[0]);
          });
          expect(portalVideoApi.save).toHaveBeenCalledTimes(1);
        }
        summary = buildExecutionSummary({
          stateRevision: 8,
          modules: sharedCourseModules().map((module, index) =>
            index === 0 ? { ...module, executionId: 'exec-module-1-new' } : module,
          ),
        });
        await act(async () => {
          reject({ status: 409, json: { error_code: 'execution_conflict' } });
        });
        await waitFor(() =>
          expect(portalVideoApi.get).toHaveBeenCalledWith(
            expect.objectContaining({ nodeExecutionId: 'exec-module-1-new' }),
            expect.any(AbortSignal),
          ),
        );
        expect(invalidate).toHaveBeenCalledWith({
          queryKey: portalLearningPathKeys.summary(ENROLLMENT_ID),
        });
        expect(invalidate).toHaveBeenCalledWith({ queryKey: portalMyEnrollmentsKeys.all });
        expect(videos[0]).not.toBeInTheDocument();
        expect(portalVideoApi.save).toHaveBeenCalledTimes(step === 'lecture' ? 0 : 1);
        expect(mockComplete).not.toHaveBeenCalled();
      },
    );

    it('bloque la validation pendant le chargement du contenu puis attend le signet et sa sauvegarde', async () => {
      const entry = await mockGetEntry(ENROLLMENT_ID, 'shared-course', 'shared-entry-1');
      mockGetEntry.mockClear();
      let loadEntry!: () => void;
      mockGetEntry.mockReturnValueOnce(
        new Promise((resolve) => {
          loadEntry = () => resolve(entry);
        }),
      );
      let loadBookmark!: () => void;
      jest.mocked(portalVideoApi.get).mockReturnValueOnce(
        new Promise((resolve) => {
          loadBookmark = () => resolve(empty);
        }),
      );
      let saveBookmark!: () => void;
      jest.mocked(portalVideoApi.save).mockImplementationOnce(
        (_context, payload) =>
          new Promise((resolve) => {
            saveBookmark = () =>
              resolve({
                ...empty,
                ...payload,
                version: 1,
                last_commit_id: payload.commit_id,
              });
          }),
      );
      const { user } = setup();
      const complete = await screen.findByRole('button', { name: 'Terminer et continuer' });
      expect(complete).toBeDisabled();
      await user.click(complete);
      expect(mockComplete).not.toHaveBeenCalled();
      expect(mockRecordTime).not.toHaveBeenCalled();
      expect(portalVideoApi.get).not.toHaveBeenCalled();

      await act(async () => loadEntry());
      const videos = await screen.findAllByLabelText<HTMLVideoElement>('Vidéo de formation');
      await waitFor(() => expect(complete).toBeEnabled());
      Object.defineProperty(videos[0], 'duration', { configurable: true, value: 600 });
      videos.forEach((video) => {
        video.pause = jest.fn(() => fireEvent.pause(video));
      });
      fireEvent.seeking(videos[0]);
      videos[0].currentTime = 30;
      fireEvent.seeked(videos[0]);
      await user.click(complete);
      expect(complete).toBeDisabled();
      expect(portalVideoApi.save).not.toHaveBeenCalled();
      expect(mockComplete).not.toHaveBeenCalled();

      await act(async () => loadBookmark());
      await waitFor(() => expect(portalVideoApi.save).toHaveBeenCalledTimes(1));
      expect(mockComplete).not.toHaveBeenCalled();
      expect(mockRecordTime).not.toHaveBeenCalled();
      expect(jest.mocked(portalVideoApi.save).mock.calls[0][1]).toMatchObject({ position: 30 });
      await act(async () => saveBookmark());
      await waitFor(() => expect(mockComplete).toHaveBeenCalledTimes(1));
    });

    it('attend toutes les vidéos avant le temps puis la validation de la visite', async () => {
      const acknowledgements: Array<() => void> = [];
      jest.mocked(portalVideoApi.save).mockImplementation(
        (_context, payload) =>
          new Promise((resolve) => {
            acknowledgements.push(() =>
              resolve({ ...empty, ...payload, version: 1, last_commit_id: payload.commit_id }),
            );
          }),
      );
      const { user, videos } = await startVideos();
      await user.click(screen.getByRole('button', { name: 'Terminer et continuer' }));
      await waitFor(() => expect(portalVideoApi.save).toHaveBeenCalledTimes(2));
      expect(videos.every((video) => video.paused)).toBe(true);
      expect(mockRecordTime).not.toHaveBeenCalled();
      expect(mockComplete).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Terminer et continuer' })).toBeDisabled();
      expect(
        jest.mocked(portalVideoApi.save).mock.calls.map(([context, payload]) => ({
          mediaId: context.mediaId,
          competencyId: context.competencyId,
          position: payload.position,
          ranges: payload.watched_ranges,
          execution: payload.node_execution_id,
          revision: payload.expected_state_revision,
        })),
      ).toEqual(
        ['video-1', 'video-2'].map((mediaId) => ({
          mediaId,
          competencyId: 'module-1',
          position: 2,
          ranges: [[0, 2]],
          execution: 'exec-module-1',
          revision: 7,
        })),
      );
      await act(async () => acknowledgements[0]());
      expect(mockComplete).not.toHaveBeenCalled();
      await act(async () => acknowledgements[1]());
      await waitFor(() => expect(mockComplete).toHaveBeenCalledTimes(1));
      expect(mockRecordTime.mock.invocationCallOrder[0]).toBeLessThan(
        mockComplete.mock.invocationCallOrder[0],
      );
    });

    it('conserve la validation manuelle même si le signet vidéo ne peut pas être sauvegardé', async () => {
      jest.mocked(portalVideoApi.save).mockRejectedValue(new Error('offline'));
      const { user } = await startVideos();
      await user.click(screen.getByRole('button', { name: 'Terminer et continuer' }));
      await waitFor(() => expect(mockComplete).toHaveBeenCalledTimes(1));
      expect(portalVideoApi.save).toHaveBeenCalled();
    });

    it.each(['temps', 'validation'])(
      'reprend la sauvegarde vidéo après un échec de %s',
      async (step) => {
        if (step === 'temps') mockRecordTime.mockRejectedValueOnce(new Error('offline'));
        else mockComplete.mockRejectedValueOnce(new Error('offline'));
        const { user, videos } = await startVideos();
        await user.click(screen.getByRole('button', { name: 'Terminer et continuer' }));
        await waitFor(() => expect(toast.error).toHaveBeenCalled());
        await waitFor(() =>
          expect(screen.getByRole('button', { name: 'Terminer et continuer' })).toBeEnabled(),
        );
        jest.mocked(portalVideoApi.save).mockClear();
        await act(async () => {
          videos[0].currentTime = 40;
          fireEvent.seeking(videos[0]);
          fireEvent.seeked(videos[0]);
        });
        expect(portalVideoApi.save).toHaveBeenCalledWith(
          expect.objectContaining({ mediaId: 'video-1' }),
          expect.objectContaining({ position: 40, version: 1 }),
          expect.any(AbortSignal),
          false,
        );
      },
    );
  });

  describe('SCORM en lecture seule pendant la simulation stagiaire', () => {
    const initialAuth = useAuthStore.getState();
    const initialSimulation = useSimulationStore.getState();
    const clients: QueryClient[] = [];
    const assetUrl =
      '/api/v1/role-simulation/training/learning-paths/12345678-1234-4123-8123-123456789abc/entries/12345678-1234-4123-8123-123456789def/scorm/assets/payload.signature/index.html';
    const scormEntry: ApiPortalContentEntry = {
      id: 'entry-2',
      content_type_id: 'type-scorm',
      module_type: 'scorm',
      data: { scorm_package_id: 'package-preview' },
      field_types: {},
      is_published: true,
    };
    const launch: ApiScormLaunch = {
      enrollment_id: ENROLLMENT_ID,
      competency_id: 'module-1',
      content_entry_id: scormEntry.id,
      scorm_package_id: 'package-preview',
      version: '1.2',
      launch_path: 'index.html',
      launch_url: assetUrl,
      node_execution_id: 'exec-module-1',
      read_only: true,
    };

    function setActor(realRole: Role, simulatedRole: Role | null = Role.TRAINEE) {
      useAuthStore.setState({
        user: {
          id: 'real-actor',
          name: 'Acteur réel',
          email: 'actor@example.test',
          role: realRole,
        },
        role: simulatedRole ?? realRole,
        simulatedRole,
      });
    }

    function deferScormEntry() {
      let resolve!: (value: { data: ApiPortalContentEntry }) => void;
      mockGetEntry.mockReturnValueOnce(
        new Promise((done) => {
          resolve = done;
        }),
      );
      return () => resolve({ data: scormEntry });
    }

    function cachedContent(client: QueryClient, entryId: string, moduleId = 'module-1') {
      return client
        .getQueryData<Formation>(portalLearningPathKeys.summary(ENROLLMENT_ID))
        ?.nodes.flatMap((node) =>
          node.type === 'module' && node.id === moduleId
            ? node.courses.flatMap((course) =>
                course.sections.flatMap((section) => section.contents),
              )
            : [],
        )
        .find((content) => content.entryId === entryId);
    }

    function expectNoTracking() {
      expect(portalScormApi.getTracking).not.toHaveBeenCalled();
      expect(portalScormApi.commitTracking).not.toHaveBeenCalled();
      expect(portalScormApi.getTrackingSequence).not.toHaveBeenCalled();
      expect(portalContentTimeApi.record).not.toHaveBeenCalled();
    }

    function expectNoTrackingOrCompletion() {
      expectNoTracking();
      expect(mockComplete).not.toHaveBeenCalled();
    }

    beforeEach(() => {
      useSimulationStore.setState({ phase: 'ready' });
      // Contenu 1 est acquis : la séquence s'ouvre sur Contenu 2, le SCORM.
      useSummary([
        {
          id: 'module-1',
          name: 'Les bases',
          courses: [
            {
              id: 'course-1',
              name: 'Découverte',
              entries: [
                { id: 'entry-1', title: 'Contenu 1', completed: true },
                { id: 'entry-2', title: 'Contenu 2' },
                { id: 'entry-3', title: 'Contenu 3' },
              ],
            },
            {
              id: 'course-2',
              name: 'Application',
              entries: [{ id: 'entry-4', title: 'Contenu 4' }],
            },
          ],
        },
        {
          id: 'module-2',
          name: 'La suite',
          actionable: false,
          courses: [
            {
              id: 'course-3',
              name: 'Perfectionnement',
              entries: [{ id: 'entry-5', title: 'Contenu 5' }],
            },
          ],
        },
      ]);
    });

    afterEach(() => {
      cleanup();
      for (const client of clients.splice(0)) client.clear();
      useAuthStore.setState(initialAuth, true);
      useSimulationStore.setState(initialSimulation, true);
    });

    it.each([Role.EDITOR, Role.CLIENT_MANAGER])(
      '%s valide le SCORM localement, déverrouille la suite et ne revient pas au SCORM après validation du contenu suivant',
      async (realRole) => {
        setActor(realRole);
        const clock = jest.spyOn(performance, 'now').mockReturnValue(0);
        summary.modules[0].courses[0].sections[0].content_entries[1].read_only = true;
        const finishEntry = deferScormEntry();
        let finishLaunch!: (value: { data: ApiScormLaunch }) => void;
        jest.mocked(portalScormApi.launch).mockResolvedValue({ data: launch });
        jest.mocked(portalScormApi.launch).mockReturnValueOnce(
          new Promise((resolve) => {
            finishLaunch = resolve;
          }),
        );
        const { client, user, unmount } = setup();
        clients.push(client);
        await screen.findByRole('heading', { name: 'Contenu 2' });
        await waitFor(() =>
          expect(mockGetEntry).toHaveBeenCalledWith(ENROLLMENT_ID, 'course-1', 'entry-2'),
        );

        // Le marqueur read_only protège le runtime, sans ouvrir la séquence.
        expect(screen.queryByRole('button', { name: /^Terminer/ })).not.toBeInTheDocument();
        expect(
          screen.queryByRole('button', { name: 'Marquer comme terminé' }),
        ).not.toBeInTheDocument();
        expect(screen.queryByTitle('Contenu SCORM')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Suivant' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Contenu 3' })).toBeDisabled();
        expect(cachedContent(client, 'entry-2')).toMatchObject({
          completed: false,
          status: 'available',
          readOnly: true,
        });
        expect(cachedContent(client, 'entry-3')).toMatchObject({
          completed: false,
          status: 'locked',
        });
        await user.click(screen.getByRole('button', { name: 'Contenu 3' }));
        expect(mockGetEntry.mock.calls.map((call) => call[2])).toEqual(['entry-2']);

        await act(async () => finishEntry());
        await waitFor(() =>
          expect(portalScormApi.launch).toHaveBeenCalledWith({
            enrollmentId: ENROLLMENT_ID,
            competencyId: 'module-1',
            courseId: 'course-1',
            entryId: 'entry-2',
            nodeExecutionId: 'exec-module-1',
          }),
        );
        expect(screen.getByRole('button', { name: 'Terminer et continuer' })).toBeEnabled();
        expect(screen.queryByTitle('Contenu SCORM')).not.toBeInTheDocument();
        expectNoTrackingOrCompletion();

        await act(async () => finishLaunch({ data: launch }));
        await waitFor(() =>
          expect(screen.getByTitle('Contenu SCORM')).toHaveAttribute('src', assetUrl),
        );
        const frame = screen.getByTitle<HTMLIFrameElement>('Contenu SCORM');
        expect(frame).not.toHaveAttribute('srcdoc');
        expect(frame.contentWindow?.parent).toBe(window);
        expect(screen.getByRole('button', { name: 'Terminer et continuer' })).toBeEnabled();

        // L'adaptateur preview reste sans crédit : ses API ne valident jamais le contenu.
        const parent = frame.contentWindow!.parent as unknown as {
          API: {
            LMSInitialize: (value: string) => string;
            LMSSetValue: (key: string, value: string) => string;
            LMSGetValue: (key: string) => string;
            LMSCommit: (value: string) => string;
            LMSFinish: (value: string) => string;
          };
        };
        const api = parent.API;
        expect(api).toBeDefined();
        await act(async () => {
          expect(api.LMSInitialize('')).toBe('true');
          expect(api.LMSGetValue('cmi.core.lesson_mode')).toBe('browse');
          expect(api.LMSGetValue('cmi.core.credit')).toBe('no-credit');
          expect(api.LMSSetValue('cmi.core.score.raw', '100')).toBe('true');
          expect(api.LMSSetValue('cmi.core.lesson_status', 'completed')).toBe('true');
          expect(api.LMSSetValue('cmi.core.session_time', '00:05:00')).toBe('true');
          expect(api.LMSCommit('')).toBe('true');
          expect(api.LMSGetValue('cmi.core.score.raw')).toBe('100');
          expect(api.LMSGetValue('cmi.core.lesson_status')).toBe('completed');
          expect(api.LMSFinish('')).toBe('true');
        });
        expectNoTrackingOrCompletion();
        expect(screen.getByRole('heading', { name: 'Contenu 2' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Terminer et continuer' })).toBeEnabled();
        expect(screen.queryByText('Terminé')).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Contenu 3' })).toBeDisabled();
        expect(cachedContent(client, 'entry-2')).toMatchObject({ completed: false });
        clock.mockReturnValue(10_000);
        await user.click(screen.getByRole('button', { name: 'Terminer et continuer' }));
        await screen.findByText('Texte de entry-3');
        await waitFor(() =>
          expect(screen.getByRole('button', { name: 'Terminer et continuer' })).toBeEnabled(),
        );
        expect(mockComplete).toHaveBeenCalledTimes(1);
        expect(mockComplete).toHaveBeenCalledWith(
          ENROLLMENT_ID,
          'module-1',
          'course-1',
          'entry-2',
          { node_execution_id: 'exec-module-1', expected_state_revision: 7 },
        );
        expect(cachedContent(client, 'entry-2')).toMatchObject({
          completed: true,
          status: 'completed',
          readOnly: true,
        });
        expect(cachedContent(client, 'entry-3')).toMatchObject({
          completed: false,
          status: 'available',
        });
        expect(cachedContent(client, 'entry-4')).toMatchObject({
          completed: false,
          status: 'locked',
        });
        expect(screen.getByRole('button', { name: 'Contenu 3' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Contenu 2' })).not.toHaveAttribute('title');
        expect(
          screen.getByRole('button', { name: 'Contenu 2' }).querySelector('.lucide-check'),
        ).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: 'Contenu 3' }).querySelector('.lucide-check'),
        ).not.toBeInTheDocument();
        expect(parent.API).toBeUndefined();
        expectNoTracking();

        // Les deux sommaires affichent la complétion normale issue du cache.
        await user.click(screen.getByRole('button', { name: 'Ouvrir la navigation' }));
        const rows = screen.getAllByRole('button', { name: 'Contenu 2' });
        expect(rows).toHaveLength(2);
        for (const row of rows) {
          expect(row).not.toHaveAttribute('title');
          expect(row.querySelector('.lucide-check')).toBeInTheDocument();
        }
        await user.click(screen.getByRole('button', { name: 'Fermer la navigation' }));

        // Relire le SCORM terminé ne propose ni nouvelle validation ni tracking.
        await user.click(screen.getByRole('button', { name: 'Précédent' }));
        await waitFor(() =>
          expect(screen.getByTitle('Contenu SCORM')).toHaveAttribute('src', assetUrl),
        );
        expect(screen.getByRole('status')).toHaveTextContent('Terminé');
        expect(screen.queryByRole('button', { name: /^Terminer/ })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Suivant' })).toBeEnabled();
        expect(mockComplete).toHaveBeenCalledTimes(1);

        await user.click(screen.getByRole('button', { name: 'Suivant' }));
        await screen.findByText('Texte de entry-3');
        await user.click(screen.getByRole('button', { name: 'Terminer et continuer' }));
        await screen.findByText('Texte de entry-4');
        await waitFor(() =>
          expect(screen.getByRole('button', { name: 'Terminer et continuer' })).toBeEnabled(),
        );
        expect(mockComplete).toHaveBeenCalledTimes(2);
        expect(mockComplete).toHaveBeenLastCalledWith(
          ENROLLMENT_ID,
          'module-1',
          'course-1',
          'entry-3',
          { node_execution_id: 'exec-module-1', expected_state_revision: 7 },
        );
        expect(cachedContent(client, 'entry-2')).toMatchObject({ completed: true });
        expect(cachedContent(client, 'entry-3')).toMatchObject({
          completed: true,
          status: 'completed',
        });
        expect(cachedContent(client, 'entry-4')).toMatchObject({
          completed: false,
          status: 'available',
        });
        expect(screen.queryByRole('heading', { name: 'Contenu 2' })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /module la suite/i })).toBeDisabled();
        expect(mockSummary).toHaveBeenCalledTimes(3);
        unmount();
        expectNoTracking();
      },
    );

    it.each([Role.EDITOR, Role.CLIENT_MANAGER])(
      '%s valide aussi le SCORM sans marqueur read_only dans le résumé',
      async (realRole) => {
        setActor(realRole);
        const finishEntry = deferScormEntry();
        jest.mocked(portalScormApi.launch).mockResolvedValue({ data: launch });
        const { client, user } = setup();
        clients.push(client);
        await screen.findByRole('heading', { name: 'Contenu 2' });
        expect(
          summary.modules[0].courses[0].sections[0].content_entries[1].read_only,
        ).toBeUndefined();
        expect(screen.queryByRole('button', { name: /^Terminer/ })).not.toBeInTheDocument();
        expect(screen.queryByTitle('Contenu SCORM')).not.toBeInTheDocument();

        await act(async () => finishEntry());
        await waitFor(() =>
          expect(screen.getByTitle('Contenu SCORM')).toHaveAttribute('src', assetUrl),
        );
        expect(screen.getByRole('button', { name: 'Terminer et continuer' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Contenu 3' })).toBeDisabled();
        expectNoTrackingOrCompletion();
        // Le rôle protège le runtime, mais la validation manuelle suit le chemin normal.
        await user.click(screen.getByRole('button', { name: 'Terminer et continuer' }));
        await screen.findByText('Texte de entry-3');
        expect(mockComplete).toHaveBeenCalledTimes(1);
        expect(mockComplete).toHaveBeenCalledWith(
          ENROLLMENT_ID,
          'module-1',
          'course-1',
          'entry-2',
          { node_execution_id: 'exec-module-1', expected_state_revision: 7 },
        );
        expect(cachedContent(client, 'entry-2')).toMatchObject({
          completed: true,
          status: 'completed',
        });
        expect(screen.getByRole('button', { name: 'Contenu 3' })).toBeEnabled();
        expectNoTracking();
      },
    );

    it('garde la suite verrouillée après un refus de validation SCORM et jusqu’au succès du nouvel essai', async () => {
      setActor(Role.EDITOR);
      summary.modules[0].courses[0].sections[0].content_entries[1].read_only = true;
      mockGetEntry.mockResolvedValueOnce({ data: scormEntry });
      jest.mocked(portalScormApi.launch).mockResolvedValue({ data: launch });
      mockComplete.mockRejectedValueOnce(new Error('Validation locale refusée'));
      let acknowledge!: () => void;
      mockComplete.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            acknowledge = () => {
              completeEntry('entry-2', 'module-1');
              resolve({ data: summary.execution });
            };
          }),
      );
      const { client, user } = setup();
      clients.push(client);
      await screen.findByTitle('Contenu SCORM');
      await user.click(screen.getByRole('button', { name: 'Terminer et continuer' }));
      await waitFor(() => expect(toast.error).toHaveBeenCalled());
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Terminer et continuer' })).toBeEnabled(),
      );
      expect(mockComplete).toHaveBeenCalledTimes(1);
      expect(cachedContent(client, 'entry-2')).toMatchObject({ completed: false });
      expect(screen.getByRole('heading', { name: 'Contenu 2' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Contenu 3' })).toBeDisabled();
      expect(
        screen.getByRole('button', { name: 'Contenu 2' }).querySelector('.lucide-check'),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Contenu 3' }));
      expect(mockGetEntry.mock.calls.map((call) => call[2])).toEqual(['entry-2']);

      await user.click(screen.getByRole('button', { name: 'Terminer et continuer' }));
      await waitFor(() => expect(mockComplete).toHaveBeenCalledTimes(2));
      expect(screen.getByRole('button', { name: 'Terminer et continuer' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Contenu 3' })).toBeDisabled();
      expect(cachedContent(client, 'entry-2')).toMatchObject({ completed: false });
      for (const call of mockComplete.mock.calls) {
        expect(call).toEqual([
          ENROLLMENT_ID,
          'module-1',
          'course-1',
          'entry-2',
          { node_execution_id: 'exec-module-1', expected_state_revision: 7 },
        ]);
      }

      await act(async () => acknowledge());
      await screen.findByText('Texte de entry-3');
      expect(cachedContent(client, 'entry-2')).toMatchObject({
        completed: true,
        status: 'completed',
      });
      expect(screen.getByRole('button', { name: 'Contenu 3' })).toBeEnabled();
      expectNoTracking();
    });

    it('valide le dernier SCORM fictif via le bouton démo SuperAdmin et actualise le cache', async () => {
      setActor(Role.SUPER_ADMIN);
      useSummary([
        {
          id: 'module-1',
          name: 'Démonstration',
          courses: [
            {
              id: 'course-1',
              name: 'Cours',
              entries: [{ id: scormEntry.id, title: 'SCORM démo' }],
            },
          ],
        },
      ]);
      mockGetEntry.mockResolvedValue({ data: scormEntry });
      jest.mocked(portalScormApi.launch).mockResolvedValue({
        data: { ...launch, read_only: false, launch_url: 'about:blank' },
      });
      const { client, user } = setup();
      clients.push(client);
      const demoComplete = await screen.findByRole('button', {
        name: 'Terminer l’activité simulée',
      });
      expect(screen.getByRole('button', { name: 'Terminer' })).toBeEnabled();
      expect(cachedContent(client, scormEntry.id)).toMatchObject({ completed: false });
      expectNoTrackingOrCompletion();
      await user.click(demoComplete);
      expect(await screen.findByRole('status')).toHaveTextContent('Terminé');
      expect(mockComplete).toHaveBeenCalledTimes(1);
      expect(mockComplete).toHaveBeenCalledWith(
        ENROLLMENT_ID,
        'module-1',
        'course-1',
        scormEntry.id,
        { node_execution_id: 'exec-module-1', expected_state_revision: 7 },
      );
      expect(screen.getByRole('button', { name: 'Suivant' })).toBeDisabled();
      expect(cachedContent(client, scormEntry.id)).toMatchObject({
        completed: true,
        status: 'completed',
      });
      const row = screen.getByRole('button', { name: 'SCORM démo' });
      expect(row).not.toHaveAttribute('title');
      expect(row.querySelector('.lucide-check')).toBeInTheDocument();
      expectNoTracking();
    });

    it('désactive le marquage pendant une transition de simulation', async () => {
      setActor(Role.EDITOR);
      mockGetEntry.mockResolvedValue({ data: scormEntry });
      jest.mocked(portalScormApi.launch).mockResolvedValue({ data: launch });
      const { client, user } = setup();
      clients.push(client);
      await screen.findByRole('button', { name: 'Terminer et continuer' });
      act(() => useSimulationStore.setState({ phase: 'transition' }));
      const button = screen.getByRole('button', { name: 'Terminer et continuer' });
      expect(button).toBeDisabled();
      await user.click(button);
      expect(screen.queryByText('Terminé')).not.toBeInTheDocument();
      expect(cachedContent(client, scormEntry.id)).toMatchObject({ completed: false });
      expect(screen.getByRole('button', { name: 'Contenu 3' })).toBeDisabled();
      expectNoTrackingOrCompletion();
    });

    it('adresse chaque validation du SCORM partagé à son occurrence et à sa visite', async () => {
      setActor(Role.EDITOR);
      useSummary(
        ['module-1', 'module-2'].map((id) => ({
          id,
          name: id,
          courses: [
            {
              id: 'course-1',
              name: 'Cours partagé',
              entries: [{ id: scormEntry.id, title: 'SCORM partagé' }],
            },
          ],
        })),
      );
      for (const module of summary.modules) {
        module.courses[0].sections[0].content_entries[0].read_only = true;
      }
      mockGetEntry.mockResolvedValue({ data: scormEntry });
      jest.mocked(portalScormApi.launch).mockImplementation(async (context) => ({
        data: {
          ...launch,
          competency_id: context.competencyId,
          node_execution_id: context.nodeExecutionId,
        },
      }));
      const { client, user } = setup();
      clients.push(client);
      await screen.findByTitle('Contenu SCORM');
      expect(screen.getAllByRole('button', { name: 'SCORM partagé' })[1]).toBeDisabled();
      await user.click(await screen.findByRole('button', { name: 'Terminer et continuer' }));
      await waitFor(() =>
        expect(screen.getAllByRole('button', { name: 'SCORM partagé' })[1]).toBeEnabled(),
      );
      await waitFor(() => expect(screen.getByRole('button', { name: 'Suivant' })).toBeEnabled());
      const rows = screen.getAllByRole('button', { name: 'SCORM partagé' });
      expect(rows[0]).not.toHaveAttribute('title');
      expect(rows[0].querySelector('.lucide-check')).toBeInTheDocument();
      expect(rows[1]).not.toHaveAttribute('title');
      expect(rows[1].querySelector('.lucide-check')).not.toBeInTheDocument();
      expect(cachedContent(client, scormEntry.id, 'module-1')).toMatchObject({ completed: true });
      expect(cachedContent(client, scormEntry.id, 'module-2')).toMatchObject({ completed: false });
      await user.click(rows[1]);
      expect(await screen.findByRole('button', { name: 'Terminer' })).toBeEnabled();
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Terminer' }));
      await waitFor(() =>
        expect(cachedContent(client, scormEntry.id, 'module-2')).toMatchObject({ completed: true }),
      );
      expect(mockComplete.mock.calls).toEqual([
        [
          ENROLLMENT_ID,
          'module-1',
          'course-1',
          scormEntry.id,
          { node_execution_id: 'exec-module-1', expected_state_revision: 7 },
        ],
        [
          ENROLLMENT_ID,
          'module-2',
          'course-1',
          scormEntry.id,
          { node_execution_id: 'exec-module-2', expected_state_revision: 7 },
        ],
      ]);
      expectNoTracking();
    });

    it.each([true, undefined])(
      'ne propose aucune validation simulée hors simulation (read_only=%s)',
      async (readOnly) => {
        setActor(Role.TRAINEE, null);
        summary.modules[0].courses[0].sections[0].content_entries[1].read_only = readOnly;
        const finishEntry = deferScormEntry();
        jest.mocked(portalScormApi.launch).mockResolvedValue({ data: launch });
        const { client, user } = setup();
        clients.push(client);
        await screen.findByRole('heading', { name: 'Contenu 2' });
        expect(screen.queryByTitle('Contenu SCORM')).not.toBeInTheDocument();
        expect(
          screen.queryByRole('button', { name: 'Marquer comme terminé' }),
        ).not.toBeInTheDocument();
        if (readOnly) {
          expect(screen.queryByRole('button', { name: /^Terminer/ })).not.toBeInTheDocument();
          await act(async () => finishEntry());
          // A cached preview launch outside simulation must fail closed.
          await screen.findByText('Impossible de charger le contenu SCORM.');
          expect(
            screen.queryByRole('button', { name: 'Marquer comme terminé' }),
          ).not.toBeInTheDocument();
          expect(screen.queryByRole('button', { name: /^Terminer/ })).not.toBeInTheDocument();
          await user.click(screen.getByRole('button', { name: 'Contenu 2' }));
          expect(cachedContent(client, scormEntry.id)).toMatchObject({ completed: false });
        } else {
          expect(screen.getByRole('button', { name: 'Terminer et continuer' })).toBeDisabled();
          await act(async () => finishEntry());
          await waitFor(() =>
            expect(screen.getByRole('button', { name: 'Terminer et continuer' })).toBeEnabled(),
          );
          expect(screen.getByRole('button', { name: 'Contenu 3' })).toBeDisabled();
        }
        expect(mockComplete).not.toHaveBeenCalled();
      },
    );
  });
});
