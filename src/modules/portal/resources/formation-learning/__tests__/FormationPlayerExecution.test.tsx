import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { portalContentEntriesApi, portalLearningPathsApi } from '@/shared/api/portal.api';
import { progressionApi } from '@/shared/api/progression.api';
import type { ApiPortalLearningPathSummary } from '@/shared/types/portal.types';
import FormationPlayer from '../FormationPlayer';
import {
  ENROLLMENT_ID,
  buildExecutionSummary,
  visit,
  type ModuleSpec,
  type SummarySpec,
} from '../lib/__fixtures__/execution-summary';

jest.mock('@/shared/api/portal.api', () => ({
  portalLearningPathsApi: { summary: jest.fn(), learnerEvaluations: jest.fn() },
  portalContentEntriesApi: { get: jest.fn(), markComplete: jest.fn() },
  portalContentTimeApi: { record: jest.fn().mockResolvedValue(undefined) },
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
const mockStart = jest.mocked(progressionApi.startNodeExecution);

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
    mockStart.mockResolvedValue({ data: summary().execution });
    mockComplete.mockResolvedValue({ data: summary().execution });
  });

  it('démarre la visite désignée par le serveur avec la révision lue', async () => {
    setup();
    await screen.findByText('Texte de entry-1');

    await waitFor(() => expect(mockStart).toHaveBeenCalledTimes(1));
    expect(mockStart).toHaveBeenCalledWith(ENROLLMENT_ID, 'exec-module-1', 7);
  });

  it('pose la révision du démarrage sans attendre le rechargement', async () => {
    // Le rechargement reste en vol. Sans la révision rapportée par le démarrage,
    // toute écriture lancée dans cette fenêtre — un commit SCORM en particulier —
    // repartirait avec la révision d'avant et serait refusée en 409.
    mockSummary.mockResolvedValueOnce({ data: summary() }).mockReturnValue(new Promise(() => {}));
    const started = summary().execution;
    mockStart.mockResolvedValue({
      data: {
        ...started,
        state_revision: 8,
        current_execution: { ...started.current_execution!, status: 'in_progress' },
      },
    });
    const { user } = setup();
    await screen.findByText('Texte de entry-1');
    await waitFor(() => expect(mockStart).toHaveBeenCalledTimes(1));

    await user.click(screen.getByRole('button', { name: 'Terminer et continuer' }));

    await waitFor(() =>
      expect(mockComplete).toHaveBeenCalledWith(ENROLLMENT_ID, 'module-1', 'course-1', 'entry-1', {
        node_execution_id: 'exec-module-1',
        expected_state_revision: 8,
      }),
    );
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
        expected_state_revision: 7,
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

  it('signale l’échec terminal et retire toute action', async () => {
    useSummary(
      summary({
        status: 'failed',
        currentExecution: null,
        modules: [{ ...LOOPED_MODULE, actionable: false }],
      }),
    );
    setup();

    await screen.findByText('Parcours en échec');
    expect(screen.queryByRole('button', { name: /Terminer/ })).not.toBeInTheDocument();
    expect(mockStart).not.toHaveBeenCalled();
  });

  it('affiche l’obligation de refaire un module déjà suivi', async () => {
    setup();

    await screen.findByText('Nouveau passage requis');
    // La couverture historique reste visible sans valoir progression.
    expect(screen.getByText(/Couverture historique/)).toBeInTheDocument();
  });

  it('n’autorise aucune écriture sur un nœud lisible mais non actionable', async () => {
    useSummary(
      summary({
        modules: [{ ...LOOPED_MODULE, actionable: false, visitStatus: 'in_progress' }],
        currentExecution: visit({ status: 'in_progress' }),
      }),
    );
    setup();
    await screen.findByRole('button', { name: 'Ouvrir la navigation' });

    // Sans visite ouverte, le contenu n'est pas seulement non modifiable : il
    // n'appartient pas au passage en cours, donc le lecteur ne l'ouvre pas.
    expect(screen.queryByText('Texte de entry-1')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Terminer/ })).not.toBeInTheDocument();
    expect(mockComplete).not.toHaveBeenCalled();
  });
});
