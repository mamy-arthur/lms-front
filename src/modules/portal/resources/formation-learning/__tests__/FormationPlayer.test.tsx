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
  visit,
  type ModuleSpec,
} from '../lib/__fixtures__/execution-summary';

jest.mock('@/shared/api/portal.api', () => ({
  portalLearningPathsApi: { summary: jest.fn(), learnerEvaluations: jest.fn() },
  portalContentEntriesApi: { get: jest.fn(), markComplete: jest.fn() },
  portalContentTimeApi: { record: jest.fn() },
  evaluationAttemptsApi: { start: jest.fn(), answer: jest.fn(), submit: jest.fn() },
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
  return { ...view, user: userEvent.setup() };
}

describe('Parcours du stagiaire piloté par le snapshot d’exécution', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    window.localStorage.clear();
    mockRecordTime.mockResolvedValue(undefined);
    useSummary(sharedCourseModules());
    mockSummary.mockImplementation(async () => ({ data: summary }));
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

  afterEach(() => jest.restoreAllMocks());

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

  it('n’autorise aucune écriture sur l’occurrence d’un module non actionable', async () => {
    setup();
    await screen.findByText('Texte de shared-entry-1');

    // Le module non ouvert est verrouillé jusqu'à son tour : son sommaire ne se
    // déplie pas, donc son occurrence du cours partagé reste hors de portée.
    expect(screen.getByRole('button', { name: /module la suite/i })).toBeDisabled();
    expect(screen.getAllByRole('button', { name: 'Contenu partagé 1' })).toHaveLength(1);
    expect(mockComplete).not.toHaveBeenCalled();
  });

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

  it('permet de naviguer vers l’occurrence du second module depuis le tiroir mobile', async () => {
    const { user } = setup();
    await screen.findByText('Texte de shared-entry-1');

    await user.click(screen.getByRole('button', { name: 'Ouvrir la navigation' }));
    const mobileNavigation = within(
      screen.getAllByRole('navigation', { name: 'Sommaire de la formation' })[1],
    );
    // Le tiroir mobile applique la même séquence que le sommaire de bureau.
    expect(mobileNavigation.getByRole('button', { name: /module la suite/i })).toBeDisabled();
    expect(mobileNavigation.getAllByRole('button', { name: 'Contenu partagé 1' })).toHaveLength(1);
    expect(mockComplete).not.toHaveBeenCalled();
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

  it('lance la visite SCORM historique après une boucle sans écriture ni nouveau temps', async () => {
    const [first, second] = sharedCourseModules(1);
    // Contenu déjà prouvé sur une visite close : il reste consultable, et la
    // séquence ne s'y applique pas puisqu'il ne reste rien à y faire.
    useSummary([
      first,
      {
        ...second,
        executionId: null,
        historicalCompleted: true,
        courses: [
          {
            ...second.courses[0],
            entries: [
              { ...second.courses[0].entries[0], completed: true, historicalCompleted: true },
            ],
          },
        ],
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
    // Le module terminé est déplié d'office : son contenu prouvé reste consultable.
    await user.click(screen.getAllByRole('button', { name: 'Contenu partagé 1' })[1]);
    await waitFor(() =>
      expect(portalScormApi.launch).toHaveBeenLastCalledWith(
        expect.objectContaining({ competencyId: 'module-2', nodeExecutionId: 'old-module-2' }),
      ),
    );
    await screen.findByRole('button', { name: 'Afficher en plein écran' });
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
});
