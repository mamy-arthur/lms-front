import { useEffect } from 'react';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { Role } from '@/shared/constants/roles';
import { apiGet } from '@/shared/lib/apiClient';
import { queryClient } from '@/shared/lib/query-client';
import { useAuthStore } from '@/shared/stores/auth.store';
import { SimulationControls } from '../SimulationControls';
import { SimulationProvider } from '../SimulationProvider';
import { clearSimulationData } from '../local-api';
import { endSimulation, synchronizeSimulation } from '../service';
import { useSimulationStore, type SimulationSession } from '../simulation.store';

const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock('sonner', () => ({ toast: { error: jest.fn() } }));
jest.mock('@/shared/lib/apiClient', () => ({
  ...jest.requireActual<typeof import('@/shared/lib/apiClient')>('@/shared/lib/apiClient'),
  apiGet: jest.fn(),
}));
jest.mock('../service', () => ({
  startSimulation: jest.fn(),
  endSimulation: jest.fn(),
  synchronizeSimulation: jest.fn(),
  clearSimulationContext: jest.fn(),
}));

const mockEnd = jest.mocked(endSimulation);
const mockSynchronize = jest.mocked(synchronizeSimulation);
const initialAuth = useAuthStore.getState();
const initialSimulation = useSimulationStore.getState();
const realUser = {
  id: 'real-user',
  name: 'Compte réel',
  email: 'real@example.test',
  role: Role.SUPER_ADMIN,
};
const session: SimulationSession = {
  allowed_roles: [Role.EDITOR, Role.CLIENT_MANAGER, Role.TRAINEE],
  simulated_role: null,
  tenant_id: null,
  shop_tenants: [],
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

// A business page whose mount effect represents its first data request.
function BusinessPage({ request }: { request: (role: Role | null) => void }) {
  const role = useAuthStore((state) => state.role);
  useEffect(() => {
    request(role);
  }, [request, role]);
  return (
    <>
      <h1>Contenu métier</h1>
      <output aria-label="Rôle de la page">{role}</output>
    </>
  );
}

function simulate(role: Role) {
  useAuthStore.getState().setSimulatedRole(role);
  useSimulationStore.setState({ session: { ...session, simulated_role: role }, phase: 'ready' });
}

beforeEach(() => {
  jest.resetAllMocks();
  mockSynchronize.mockResolvedValue(undefined);
  useAuthStore.setState({
    user: realUser,
    role: realUser.role,
    simulatedRole: null,
    sessionId: 'real-session',
  });
  useSimulationStore.setState({ session, phase: 'ready', returnPath: null, epoch: 0, error: null });
});

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
  queryClient.clear();
  clearSimulationData();
  useAuthStore.setState(initialAuth, true);
  useSimulationStore.setState(initialSimulation, true);
  localStorage.clear();
});

describe('SimulationProvider', () => {
  it.each([
    [Role.EDITOR, 'Éditeur'],
    [Role.CLIENT_MANAGER, 'Client'],
    [Role.TRAINEE, 'Stagiaire'],
  ] as const)(
    'keeps the compact %s exit available across pages without a banner',
    (role, label) => {
      simulate(role);
      const { rerender } = render(
        <SimulationProvider>
          <SimulationControls />
          <h1>Formations</h1>
        </SimulationProvider>,
      );

      for (const page of ['Formations', 'Boutique', 'Profil']) {
        rerender(
          <SimulationProvider>
            <SimulationControls />
            <h1>{page}</h1>
          </SimulationProvider>,
        );
        expect(screen.getByRole('heading', { name: page })).toBeVisible();
        expect(
          screen.queryByRole('complementary', { name: 'Mode simulation' }),
        ).not.toBeInTheDocument();
        const exit = screen.getByRole('button', { name: 'Quitter la simulation' });
        expect(exit).toBeEnabled();
        expect(exit).toHaveAttribute('title', `Mode simulation : rôle ${label}`);
      }
      expect(useAuthStore.getState().user).toBe(realUser);
    },
  );

  it('keeps an emergency exit on the error screen and restores the destination without logging out', async () => {
    simulate(Role.CLIENT_MANAGER);
    const returnPath = '/admin/users?page=3';
    useSimulationStore.setState({ returnPath, phase: 'error', error: 'Vérification indisponible' });
    const clearAuth = jest.spyOn(useAuthStore.getState(), 'clearAuth');
    const result = deferred<string>();
    mockEnd.mockReturnValueOnce(result.promise);
    const user = userEvent.setup();
    render(
      <SimulationProvider>
        <h1>Profil</h1>
      </SimulationProvider>,
    );

    await waitFor(() => expect(mockSynchronize).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('heading', { name: 'Profil' })).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Vérification indisponible');
    await user.click(screen.getByRole('button', { name: 'Quitter la simulation' }));
    expect(mockEnd).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();

    await act(async () => {
      // The mocked service completes its documented state restoration.
      useAuthStore.getState().setSimulatedRole(null);
      useSimulationStore.setState({ session, phase: 'ready', returnPath: null, error: null });
      result.resolve(returnPath);
      await result.promise;
    });

    expect(mockReplace).toHaveBeenCalledWith(returnPath);
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(clearAuth).not.toHaveBeenCalled();
    expect(useAuthStore.getState()).toMatchObject({
      user: realUser,
      role: Role.SUPER_ADMIN,
      sessionId: 'real-session',
    });
    expect(
      screen.queryByRole('complementary', { name: 'Mode simulation' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Profil' })).toBeVisible();
  });

  it.each(['idle', 'checking', 'transition', 'error'] as const)(
    'does not mount business children or start their requests during %s',
    (phase) => {
      const error = phase === 'error' ? 'Impossible de vérifier le mode simulation.' : null;
      useSimulationStore.setState({ phase, error });
      const request = jest.fn();
      render(
        <SimulationProvider>
          <BusinessPage request={request} />
        </SimulationProvider>,
      );

      expect(mockSynchronize).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('heading', { name: 'Contenu métier' })).not.toBeInTheDocument();
      expect(request).not.toHaveBeenCalled();
      if (error) {
        expect(screen.getByRole('alert')).toHaveTextContent(error);
        expect(screen.getByRole('button', { name: 'Réessayer' })).toBeEnabled();
      }
    },
  );

  it('does not mount business children before persisted authentication is hydrated', () => {
    jest.spyOn(useAuthStore.persist, 'hasHydrated').mockReturnValue(false);
    const request = jest.fn();
    render(
      <SimulationProvider>
        <BusinessPage request={request} />
      </SimulationProvider>,
    );

    expect(mockSynchronize).not.toHaveBeenCalled();
    expect(screen.queryByRole('heading', { name: 'Contenu métier' })).not.toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();
  });

  it.each([
    { previous: null, serverRole: Role.CLIENT_MANAGER },
    { previous: Role.EDITOR, serverRole: null },
  ])(
    'treats the initial GET as authoritative: $previous → $serverRole before mounting pages',
    async ({ previous, serverRole }) => {
      useAuthStore.getState().setSimulatedRole(previous);
      useSimulationStore.setState({ phase: 'idle', session: null });
      const response = deferred<{ data: SimulationSession }>();
      const get = jest.mocked(apiGet).mockReturnValueOnce(response.promise);
      // Keep other lifecycle tests isolated; here exercise the real GET-to-store contract.
      const actualService = jest.requireActual<typeof import('../service')>('../service');
      mockSynchronize.mockImplementationOnce(actualService.synchronizeSimulation);
      const request = jest.fn();
      render(
        <SimulationProvider>
          <BusinessPage request={request} />
        </SimulationProvider>,
      );

      await waitFor(() => expect(get).toHaveBeenCalledWith('role-simulation'));
      expect(get).toHaveBeenCalledTimes(1);
      expect(request).not.toHaveBeenCalled();
      expect(screen.queryByRole('heading', { name: 'Contenu métier' })).not.toBeInTheDocument();

      await act(async () => {
        response.resolve({ data: { ...session, simulated_role: serverRole } });
        await mockSynchronize.mock.results[0].value;
      });

      expect(screen.getByRole('heading', { name: 'Contenu métier' })).toBeVisible();
      expect(screen.getByLabelText('Rôle de la page')).toHaveTextContent(
        serverRole ?? Role.SUPER_ADMIN,
      );
      expect(request).toHaveBeenCalledTimes(1);
      expect(request).toHaveBeenCalledWith(serverRole ?? Role.SUPER_ADMIN);
      expect(
        screen.queryByRole('complementary', { name: 'Mode simulation' }),
      ).not.toBeInTheDocument();
      expect(useAuthStore.getState().simulatedRole).toBe(serverRole);
      expect(useAuthStore.getState().user).toBe(realUser);
      expect(useAuthStore.getState().sessionId).toBe('real-session');
      expect(mockReplace).not.toHaveBeenCalled();
    },
  );

  it('retries synchronization from an error without mounting business children while it checks', async () => {
    useSimulationStore.setState({ phase: 'error', error: 'Vérification indisponible' });
    const user = userEvent.setup();
    const request = jest.fn();
    render(
      <SimulationProvider>
        <BusinessPage request={request} />
      </SimulationProvider>,
    );
    const result = deferred<void>();
    mockSynchronize.mockImplementationOnce(() => {
      useSimulationStore.setState({ phase: 'checking', error: null });
      return result.promise;
    });

    await user.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(mockSynchronize).toHaveBeenCalledTimes(2);
    expect(request).not.toHaveBeenCalled();
    expect(screen.queryByRole('heading', { name: 'Contenu métier' })).not.toBeInTheDocument();

    await act(async () => {
      useSimulationStore.setState({ phase: 'ready', error: null });
      result.resolve();
      await result.promise;
    });
    expect(screen.getByRole('heading', { name: 'Contenu métier' })).toBeVisible();
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('keeps the emergency exit after a rejected exit without navigating or logging out', async () => {
    simulate(Role.TRAINEE);
    useSimulationStore.setState({ phase: 'error', error: 'Vérification indisponible' });
    mockEnd.mockRejectedValueOnce(new Error('Exit could not be confirmed'));
    const clearAuth = jest.spyOn(useAuthStore.getState(), 'clearAuth');
    const user = userEvent.setup();
    render(
      <SimulationProvider>
        <h1>Profil</h1>
      </SimulationProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Quitter la simulation' }));
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'La sortie n’a pas pu être confirmée. La simulation reste isolée.',
      ),
    );
    expect(mockEnd).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
    expect(clearAuth).not.toHaveBeenCalled();
    expect(useAuthStore.getState().user).toBe(realUser);
    expect(useAuthStore.getState().simulatedRole).toBe(Role.TRAINEE);
    expect(screen.getByRole('alert')).toHaveTextContent('Vérification indisponible');
    expect(screen.getByRole('button', { name: 'Quitter la simulation' })).toBeEnabled();
    expect(screen.queryByRole('heading', { name: 'Profil' })).not.toBeInTheDocument();
  });
});
