import { QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormationList from '@/modules/portal/resources/formation-list/FormationList';
import { Role } from '@/shared/constants/roles';
import { apiPost } from '@/shared/lib/apiClient';
import { queryClient } from '@/shared/lib/query-client';
import { useAuthStore } from '@/shared/stores/auth.store';
import { SimulationProvider } from '../SimulationProvider';
import { clearSimulationData, hasSimulationData } from '../local-api';
import { startSimulation } from '../service';
import { useSimulationStore, type SimulationSession } from '../simulation.store';
import { cancelSimulationRequests } from '../transport';

jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: jest.fn() }) }));

const originalFetch = Object.getOwnPropertyDescriptor(global, 'fetch');
const initialAuth = useAuthStore.getState();
const initialSimulation = useSimulationStore.getState();
const defaults = queryClient.getDefaultOptions();
const mockFetch = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>();
let session: SimulationSession;
let confirmSession: () => Promise<Response>;
const controlUrl = '/api/v1/role-simulation';
const catalogUrl = '/api/v1/role-simulation/training/learning-paths?page=1&per_page=100';

function response(data: unknown, status = 200): Response {
  return {
    ok: status < 400,
    status,
    headers: new Headers(),
    text: async () => JSON.stringify(data),
  } as Response;
}

const controlReads = () =>
  mockFetch.mock.calls.filter(
    ([url, options]) => url === controlUrl && (!options?.method || options.method === 'GET'),
  );

beforeEach(() => {
  queryClient.clear();
  queryClient.setDefaultOptions({ queries: { retry: false, staleTime: Infinity } });
  jest.spyOn(useAuthStore.persist, 'hasHydrated').mockReturnValue(true);
  useAuthStore.setState({
    user: { id: 'actor', name: 'Acteur réel', email: 'actor@example.test', role: Role.EDITOR },
    role: Role.EDITOR,
    simulatedRole: null,
    sessionId: 'real-session',
  });
  session = {
    allowed_roles: [Role.TRAINEE],
    simulated_role: null,
    tenant_id: 'tenant',
    shop_tenants: [],
  };
  useSimulationStore.setState({ phase: 'ready', session, returnPath: null, error: null });
  confirmSession = async () => response({ data: session });
  mockFetch.mockReset();
  mockFetch.mockImplementation(async (url, options) => {
    if (url === controlUrl && options?.method === 'POST') {
      session = { ...session, simulated_role: Role.TRAINEE };
      return response({ data: session });
    }
    if (url === controlUrl && (!options?.method || options.method === 'GET')) {
      return confirmSession();
    }
    if (url === catalogUrl && (!options?.method || options.method === 'GET')) {
      return response({
        data: [{ id: 'path', name: 'Formation disponible', competencies_count: 1 }],
        meta: { current_page: 1, last_page: 1 },
      });
    }
    throw new Error('Unexpected business network call');
  });
  Object.defineProperty(global, 'fetch', { configurable: true, writable: true, value: mockFetch });
});

afterEach(() => {
  cleanup();
  cancelSimulationRequests();
  clearSimulationData();
  queryClient.clear();
  queryClient.setDefaultOptions(defaults);
  useAuthStore.setState(initialAuth, true);
  useSimulationStore.setState(initialSimulation, true);
  jest.restoreAllMocks();
  if (originalFetch) Object.defineProperty(global, 'fetch', originalFetch);
  else Reflect.deleteProperty(global, 'fetch');
});

async function mountList(role = Role.EDITOR) {
  useAuthStore.setState((state) => ({ user: { ...state.user!, role }, role }));
  await startSimulation(Role.TRAINEE);
  render(
    <QueryClientProvider client={queryClient}>
      <SimulationProvider>
        <FormationList />
      </SimulationProvider>
    </QueryClientProvider>,
  );
  await screen.findByRole('button', { name: /Formation disponible/ });
  expect(controlReads()).toHaveLength(1); // Normal provider mount synchronization.
}

it.each([Role.EDITOR, Role.CLIENT_MANAGER])(
  '%s recovers the list after module memory loss, only after server confirmation',
  async (role) => {
    await mountList(role);
    const actor = useAuthStore.getState().user;
    const catalogReadsBefore = mockFetch.mock.calls.filter(([url]) => url === catalogUrl).length;
    let confirm!: (value: Response) => void;
    confirmSession = () =>
      new Promise((resolve) => {
        confirm = resolve;
      });

    // Fast Refresh can clear local-api module state but keep the stores and mounted provider.
    clearSimulationData();
    await act(async () => {
      await queryClient.invalidateQueries();
    });
    await waitFor(() => expect(controlReads()).toHaveLength(2));
    expect(hasSimulationData(Role.TRAINEE)).toBe(false);
    expect(useSimulationStore.getState().phase).toBe('checking');
    expect(screen.queryByRole('heading', { name: 'Mes formations' })).not.toBeInTheDocument();
    await expect(
      apiPost('platform/certificates', { name: 'Must not be sent' }),
    ).rejects.toMatchObject({
      name: 'AbortError',
    });

    await act(async () => {
      confirm(response({ data: session }));
    });
    expect(await screen.findByRole('button', { name: /Formation disponible/ })).toBeVisible();
    expect(
      screen.queryByText('Impossible de charger les formations. Réessayez.'),
    ).not.toBeInTheDocument();
    expect(hasSimulationData(Role.TRAINEE)).toBe(true);
    expect(useAuthStore.getState().user).toBe(actor);
    expect(useAuthStore.getState().sessionId).toBe('real-session');
    expect(mockFetch.mock.calls.filter(([url]) => url === catalogUrl)).toHaveLength(
      catalogReadsBefore + 1,
    );
    expect(mockFetch.mock.calls.filter(([, options]) => options?.method === 'POST')).toHaveLength(
      1,
    );
  },
);

it('fails closed if recovery is unconfirmed and lets the user retry verification', async () => {
  await mountList();
  confirmSession = async () => {
    throw new Error('Offline');
  };
  clearSimulationData();
  await act(async () => {
    await queryClient.invalidateQueries();
  });
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Impossible de vérifier le mode simulation',
  );
  expect(hasSimulationData(Role.TRAINEE)).toBe(false);
  expect(useSimulationStore.getState().phase).toBe('error');
  expect(controlReads()).toHaveLength(2);
  expect(screen.queryByRole('button', { name: /Formation disponible/ })).not.toBeInTheDocument();

  confirmSession = async () => response({ data: session });
  await userEvent.setup().click(screen.getByRole('button', { name: 'Réessayer' }));
  expect(await screen.findByRole('button', { name: /Formation disponible/ })).toBeVisible();
  expect(controlReads()).toHaveLength(3);
});

it('does not reset a healthy simulation for unrelated query errors', async () => {
  await mountList();
  const epoch = useSimulationStore.getState().epoch;
  const failures = [
    new Error('Ordinary request failure'),
    Object.assign(new Error('Forbidden'), { status: 403 }),
    Object.assign(new Error('Execution conflict'), {
      status: 409,
      json: { code: 'EXECUTION_CONFLICT' },
    }),
    // Even a stale missing-data error must not reset an already restored engine.
    Object.assign(new Error('Stale missing data'), {
      status: 409,
      json: { code: 'SIMULATION_INACTIVE' },
    }),
  ];
  await act(async () => {
    for (const [index, error] of failures.entries()) {
      await expect(
        queryClient.fetchQuery({
          queryKey: ['unrelated', index],
          queryFn: async () => {
            throw error;
          },
        }),
      ).rejects.toBe(error);
    }
  });
  expect(controlReads()).toHaveLength(1);
  expect(useSimulationStore.getState().epoch).toBe(epoch);
  expect(screen.getByRole('button', { name: /Formation disponible/ })).toBeVisible();
});

it('never retries a mutation after local data is lost', async () => {
  await mountList();
  const callsBefore = mockFetch.mock.calls.length;
  clearSimulationData();
  await expect(
    apiPost('platform/certificates', { name: 'Must not be replayed' }),
  ).rejects.toMatchObject({
    status: 409,
    json: { code: 'SIMULATION_INACTIVE' },
  });
  expect(mockFetch).toHaveBeenCalledTimes(callsBefore);
  expect(hasSimulationData(Role.TRAINEE)).toBe(false);
});
