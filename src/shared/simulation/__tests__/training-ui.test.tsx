import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormationListPage from '@/modules/portal/resources/formation-list/FormationList';
import type {
  MyEnrollmentsQueryParams,
  useMyEnrollmentsQuery,
} from '@/modules/portal/resources/formation-list/hooks/useMyEnrollmentsQuery';
import type { usePurchasedLearningPathCategoriesQuery } from '@/modules/portal/resources/purchased-learning-paths/hooks/usePurchasedLearningPathCategoriesQuery';
import type { TraineeFormation } from '@/modules/portal/resources/_shared/trainee/types';
import { Role } from '@/shared/constants/roles';
import { useAuthStore } from '@/shared/stores/auth.store';
import { SimulationControls } from '../SimulationControls';
import { SimulationProvider } from '../SimulationProvider';
import { synchronizeSimulation } from '../service';
import { useSimulationStore } from '../simulation.store';

type EnrollmentQueryState = Pick<
  ReturnType<typeof useMyEnrollmentsQuery>,
  'data' | 'isLoading' | 'isFetching' | 'isError' | 'refetch'
>;

const mockEnrollments = jest.fn<EnrollmentQueryState, [params?: MyEnrollmentsQueryParams]>();
const mockCategories = jest.fn<
  Pick<ReturnType<typeof usePurchasedLearningPathCategoriesQuery>, 'data'>,
  []
>();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRefetch = jest.fn();
const mockFetch = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
const originalFetch = Object.getOwnPropertyDescriptor(global, 'fetch');

jest.mock('@/modules/portal/resources/formation-list/hooks/useMyEnrollmentsQuery', () => ({
  useMyEnrollmentsQuery: (params?: MyEnrollmentsQueryParams) => mockEnrollments(params),
}));
jest.mock(
  '@/modules/portal/resources/purchased-learning-paths/hooks/usePurchasedLearningPathCategoriesQuery',
  () => ({ usePurchasedLearningPathCategoriesQuery: () => mockCategories() }),
);
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));
jest.mock('../service', () => ({
  startSimulation: jest.fn(),
  synchronizeSimulation: jest.fn(),
  clearSimulationContext: jest.fn(),
  endSimulation: jest.fn(),
}));

const mockSynchronize = jest.mocked(synchronizeSimulation);
const initialAuth = useAuthStore.getState();
const initialSimulation = useSimulationStore.getState();
const ordinaryDescription =
  'Retrouvez toutes vos formations, leur progression et vos attestations.';
const previewActors = [
  {
    role: Role.EDITOR,
    description: 'Aperçu stagiaire des formations de votre tenant. La progression reste simulée.',
  },
  {
    role: Role.CLIENT_MANAGER,
    description: 'Aperçu stagiaire de vos formations achetées. La progression reste simulée.',
  },
] as const;

// Normalized query data: real title/cover, but only a synthetic enrollment is navigable.
const enrollmentId = 'd3e00000-0000-4000-8000-000000001001';
const formation: TraineeFormation = {
  id: enrollmentId,
  slug: enrollmentId,
  title: 'Prévention des risques',
  description: 'Les bons gestes pour travailler en sécurité.',
  category: 'Prévention',
  coverImage: '/api/v1/role-simulation/training/learning-paths/real-path/media/real-cover',
  progress: 0,
  completedModules: 0,
  totalModules: 1,
  totalDurationMin: 90,
  status: 'not_started',
  enrolledAt: '2026-09-18T09:00:00.000Z',
  lastActivity: "Aujourd'hui",
  hasAttestation: false,
};

let enrollmentQuery: EnrollmentQueryState;

function setActor(realRole: Role, simulatedRole: Role | null = Role.TRAINEE) {
  useAuthStore.setState({
    user: { id: 'real-actor', name: 'Compte réel', email: 'real@example.test', role: realRole },
    role: simulatedRole ?? realRole,
    simulatedRole,
    sessionId: 'real-session',
  });
  useSimulationStore.setState({
    phase: 'ready',
    session: {
      allowed_roles: realRole === Role.TRAINEE ? [] : [Role.TRAINEE],
      simulated_role: simulatedRole,
      tenant_id: 'real-tenant',
      shop_tenants: [],
    },
    returnPath: null,
    epoch: 0,
    error: null,
  });
}

function trainingUi() {
  return (
    <SimulationProvider>
      <SimulationControls />
      <FormationListPage />
    </SimulationProvider>
  );
}

async function renderTrainingUi() {
  const view = render(trainingUi());
  expect(mockSynchronize).toHaveBeenCalledTimes(1);
  // Settle the provider's .then() before assertions/cleanup, not outside React's act boundary.
  await act(async () => {
    await mockSynchronize.mock.results[0].value;
  });
  return view;
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(useAuthStore.persist, 'hasHydrated').mockReturnValue(true);
  // jsdom does not supply fetch; install a fail-closed stub rather than spying on it.
  Object.defineProperty(global, 'fetch', { configurable: true, writable: true, value: mockFetch });
  mockFetch.mockRejectedValue(new Error('Unexpected UI network request'));
  mockSynchronize.mockResolvedValue(undefined);
  mockRefetch.mockResolvedValue(undefined);
  enrollmentQuery = {
    data: { data: [formation], total: 1 },
    isLoading: false,
    isFetching: false,
    isError: false,
    refetch: mockRefetch,
  };
  mockEnrollments.mockImplementation(() => enrollmentQuery);
  mockCategories.mockReturnValue({
    data: [
      {
        id: 'd3e00000-0000-4000-8000-000000001002',
        tenant_id: 'd3e00000-0000-4000-8000-000000000001',
        name: 'Prévention',
        description: null,
        created_at: formation.enrolledAt,
        updated_at: formation.enrolledAt,
      },
    ],
  });
  setActor(Role.EDITOR);
});

afterEach(() => {
  cleanup();
  useAuthStore.setState(initialAuth, true);
  useSimulationStore.setState(initialSimulation, true);
  localStorage.clear();
  jest.restoreAllMocks();
  if (originalFetch) Object.defineProperty(global, 'fetch', originalFetch);
  else Reflect.deleteProperty(global, 'fetch');
  expect(mockFetch).not.toHaveBeenCalled();
});

describe('FormationList training preview', () => {
  it.each(previewActors)(
    'shows the $role source, real formation name/cover, and synthetic enrollment destination',
    async ({ role, description }) => {
      setActor(role);
      const user = userEvent.setup();
      await renderTrainingUi();

      expect(screen.getByRole('heading', { name: 'Mes formations' })).toBeVisible();
      expect(screen.getByText(description)).toBeVisible();
      expect(screen.queryByText(ordinaryDescription)).not.toBeInTheDocument();
      const otherDescription = previewActors.find((actor) => actor.role !== role)!.description;
      expect(screen.queryByText(otherDescription)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Prévention' })).toBeVisible();
      expect(mockCategories).toHaveBeenCalled();
      expect(mockEnrollments).toHaveBeenCalledWith({
        per_page: 12,
        page: 1,
        q: undefined,
        status: undefined,
        sort_by: 'enrolled_at',
        sort_dir: 'desc',
        category_id: undefined,
      });

      // Keep FormationCard real: its image and router.push must use the query's values.
      const card = screen.getByRole('button', { name: /Prévention des risques/ });
      expect(within(card).getByText(formation.title)).toBeVisible();
      expect(within(card).getByRole('img', { name: formation.title })).toHaveAttribute(
        'src',
        formation.coverImage,
      );
      expect(within(card).getByText('À commencer')).toBeVisible();
      expect(within(card).getByText('0%')).toBeVisible();
      expect(screen.queryByText(/démonstration/i)).not.toBeInTheDocument();

      await user.click(card);
      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith(`/my-learning-paths/${enrollmentId}`);
      expect(mockReplace).not.toHaveBeenCalled();
    },
  );

  it.each(previewActors)(
    'keeps an empty $role catalog empty without demo fallback',
    async ({ role }) => {
      setActor(role);
      enrollmentQuery.data = { data: [], total: 0 };
      mockCategories.mockReturnValue({ data: [] });
      await renderTrainingUi();

      expect(screen.getByText('Aucune formation trouvée')).toBeVisible();
      expect(screen.queryByText(formation.title)).not.toBeInTheDocument();
      expect(screen.queryByText(/démonstration/i)).not.toBeInTheDocument();
      expect(screen.queryAllByRole('img')).toHaveLength(0);
      expect(screen.queryAllByRole('link')).toHaveLength(0);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Voir plus' })).not.toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    },
  );

  it.each(previewActors)(
    'shows a retryable $role query error rather than empty/demo content',
    async ({ role }) => {
      setActor(role);
      enrollmentQuery = { ...enrollmentQuery, data: undefined, isError: true };
      const user = userEvent.setup();
      const view = await renderTrainingUi();

      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Impossible de charger les formations. Réessayez.');
      expect(screen.queryByText('Aucune formation trouvée')).not.toBeInTheDocument();
      expect(screen.queryByText(/démonstration/i)).not.toBeInTheDocument();
      expect(screen.queryAllByRole('img')).toHaveLength(0);
      const retry = within(alert).getByRole('button', { name: 'Réessayer' });
      expect(retry).toBeEnabled();
      expect(mockRefetch).not.toHaveBeenCalled();

      await user.click(retry);
      expect(mockRefetch).toHaveBeenCalledTimes(1);
      expect(mockSynchronize).toHaveBeenCalledTimes(1);

      enrollmentQuery = {
        ...enrollmentQuery,
        isError: false,
        data: { data: [formation], total: 1 },
      };
      view.rerender(trainingUi());
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByText(formation.title)).toBeVisible();
    },
  );

  it.each(previewActors)(
    'disables $role retries while fetching, even with stale data',
    async ({ role }) => {
      setActor(role);
      enrollmentQuery = { ...enrollmentQuery, isError: true, isFetching: true };
      const user = userEvent.setup();
      await renderTrainingUi();

      const retry = within(screen.getByRole('alert')).getByRole('button', { name: 'Réessayer' });
      expect(retry).toBeDisabled();
      expect(screen.queryByText(formation.title)).not.toBeInTheDocument();
      expect(screen.queryByText('Aucune formation trouvée')).not.toBeInTheDocument();
      await user.click(retry);
      expect(mockRefetch).not.toHaveBeenCalled();
    },
  );
});

describe('Training simulation controls', () => {
  it.each(previewActors)(
    'offers a compact exit for $role → TRAINEE without a banner',
    async ({ role }) => {
      setActor(role);
      await renderTrainingUi();

      expect(
        screen.queryByRole('complementary', { name: 'Mode simulation' }),
      ).not.toBeInTheDocument();
      const exit = screen.getByRole('button', { name: 'Quitter la simulation' });
      expect(exit).toBeEnabled();
      expect(exit).toHaveAttribute('title', 'Mode simulation : rôle Stagiaire');
      expect(useAuthStore.getState()).toMatchObject({
        user: { role },
        role: Role.TRAINEE,
        simulatedRole: Role.TRAINEE,
        sessionId: 'real-session',
      });
    },
  );

  it('retains fictional formations and ordinary list copy for SUPER_ADMIN → TRAINEE', async () => {
    setActor(Role.SUPER_ADMIN);
    enrollmentQuery.data = {
      data: [
        {
          ...formation,
          title: 'Formation de démonstration',
          coverImage: '/simulation/formation-cover.svg',
        },
      ],
      total: 1,
    };
    await renderTrainingUi();

    expect(
      screen.queryByRole('complementary', { name: 'Mode simulation' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Quitter la simulation' })).toBeEnabled();
    expect(screen.getByText(ordinaryDescription)).toBeVisible();
    expect(screen.queryByText(/Aperçu stagiaire/)).not.toBeInTheDocument();
    expect(screen.getByText('Formation de démonstration')).toBeVisible();
    expect(screen.getByRole('img', { name: 'Formation de démonstration' })).toHaveAttribute(
      'src',
      '/simulation/formation-cover.svg',
    );
  });

  it.each([Role.EDITOR, Role.CLIENT_MANAGER, Role.TRAINEE])(
    'does not show preview copy or a banner for an unsimulated %s',
    async (role) => {
      setActor(role, null);
      await renderTrainingUi();

      expect(
        screen.queryByRole('complementary', { name: 'Mode simulation' }),
      ).not.toBeInTheDocument();
      expect(screen.getByText(ordinaryDescription)).toBeVisible();
      expect(screen.queryByText(/Aperçu stagiaire/)).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Quitter la simulation' }),
      ).not.toBeInTheDocument();
    },
  );
});
