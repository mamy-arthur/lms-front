import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { Role } from '@/shared/constants/roles';
import { useAuthStore } from '@/shared/stores/auth.store';
import { SimulationControls } from '../SimulationControls';
import { startSimulation } from '../service';
import { useSimulationStore, type SimulationSession } from '../simulation.store';

const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock('sonner', () => ({ toast: { error: jest.fn() } }));
jest.mock('../service', () => ({ startSimulation: jest.fn() }));

const mockStart = jest.mocked(startSimulation);
const initialAuth = useAuthStore.getState();
const initialSimulation = useSimulationStore.getState();

// The server's real-actor matrix, not a client-side permission calculation.
const allowedRoles: Record<Role, Role[]> = {
  [Role.SUPER_ADMIN]: [Role.EDITOR, Role.CLIENT_MANAGER, Role.TRAINEE],
  [Role.EDITOR]: [Role.CLIENT_MANAGER, Role.TRAINEE],
  [Role.CLIENT_MANAGER]: [Role.TRAINEE],
  [Role.TRAINEE]: [],
};
const labels: Record<Role, string> = {
  [Role.SUPER_ADMIN]: 'Super admin',
  [Role.EDITOR]: 'Éditeur',
  [Role.CLIENT_MANAGER]: 'Client',
  [Role.TRAINEE]: 'Stagiaire',
};
const directTransitions = [
  [Role.SUPER_ADMIN, Role.EDITOR, '/admin/programs'],
  [Role.SUPER_ADMIN, Role.CLIENT_MANAGER, '/dashboard'],
  [Role.SUPER_ADMIN, Role.TRAINEE, '/trainee/formations'],
  [Role.EDITOR, Role.CLIENT_MANAGER, '/dashboard'],
  [Role.EDITOR, Role.TRAINEE, '/trainee/formations'],
  [Role.CLIENT_MANAGER, Role.TRAINEE, '/trainee/formations'],
] as const;

function authorize(realRole: Role, overrides: Partial<SimulationSession> = {}) {
  const session: SimulationSession = {
    allowed_roles: allowedRoles[realRole],
    simulated_role: null,
    tenant_id: null,
    shop_tenants: [],
    ...overrides,
  };
  useAuthStore.setState({
    user: { id: 'real-user', name: 'Compte réel', email: 'real@example.test', role: realRole },
    role: session.simulated_role ?? realRole,
    simulatedRole: session.simulated_role,
    sessionId: 'real-session',
  });
  useSimulationStore.setState({ session, phase: 'ready', returnPath: null, epoch: 0, error: null });
}

beforeEach(() => {
  jest.resetAllMocks();
  authorize(Role.SUPER_ADMIN);
});

afterEach(() => {
  cleanup();
  useAuthStore.setState(initialAuth, true);
  useSimulationStore.setState(initialSimulation, true);
  localStorage.clear();
});

describe('SimulationControls', () => {
  it.each(Object.values(Role))(
    'shows only server-authorized role options for %s',
    async (realRole) => {
      authorize(realRole);
      const user = userEvent.setup();
      render(<SimulationControls />);

      if (realRole === Role.TRAINEE) {
        expect(screen.queryByRole('button', { name: 'Simuler un rôle' })).not.toBeInTheDocument();
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
        expect(mockStart).not.toHaveBeenCalled();
        return;
      }

      await user.click(screen.getByRole('button', { name: 'Simuler un rôle' }));
      const selector = screen.getByRole('combobox', { name: 'Rôle à simuler' });
      expect(
        within(selector)
          .getAllByRole('option')
          .map((option) => (option as HTMLOptionElement).value),
      ).toEqual(['', ...allowedRoles[realRole]]);
      for (const role of allowedRoles[realRole]) {
        expect(within(selector).getByRole('option', { name: labels[role] })).toHaveValue(role);
      }
      expect(screen.getByRole('button', { name: 'Démarrer la simulation' })).toBeDisabled();
    },
  );

  it('uses the returned allowed_roles rather than inferring extra permissions from the real role', async () => {
    authorize(Role.SUPER_ADMIN, { allowed_roles: [Role.TRAINEE] });
    const user = userEvent.setup();
    render(<SimulationControls />);
    await user.click(screen.getByRole('button', { name: 'Simuler un rôle' }));

    const selector = screen.getByRole('combobox', { name: 'Rôle à simuler' });
    expect(within(selector).getAllByRole('option')).toHaveLength(2);
    expect(within(selector).getByRole('option', { name: 'Stagiaire' })).toBeInTheDocument();
    expect(within(selector).queryByRole('option', { name: 'Éditeur' })).not.toBeInTheDocument();
    expect(within(selector).queryByRole('option', { name: 'Client' })).not.toBeInTheDocument();
  });

  it('hides the entry point when the server grants no simulated roles', () => {
    authorize(Role.SUPER_ADMIN, { allowed_roles: [] });
    render(<SimulationControls />);
    expect(screen.queryByRole('button', { name: 'Simuler un rôle' })).not.toBeInTheDocument();
  });

  it('hides the entry point without an authenticated account', () => {
    useAuthStore.getState().clearAuth();
    render(<SimulationControls />);
    expect(screen.queryByRole('button', { name: 'Simuler un rôle' })).not.toBeInTheDocument();
  });

  it.each(directTransitions)(
    'prevents chaining when %s is already simulating %s',
    (realRole, simulatedRole) => {
      authorize(realRole, { simulated_role: simulatedRole });
      render(<SimulationControls />);

      expect(screen.queryByRole('button', { name: 'Simuler un rôle' })).not.toBeInTheDocument();
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
      expect(mockStart).not.toHaveBeenCalled();
    },
  );

  it.each(directTransitions)(
    'starts %s → %s directly and redirects to %s',
    async (realRole, targetRole, destination) => {
      authorize(realRole);
      mockStart.mockResolvedValueOnce(destination);
      const user = userEvent.setup();
      render(<SimulationControls />);

      await user.click(screen.getByRole('button', { name: 'Simuler un rôle' }));
      await user.selectOptions(
        screen.getByRole('combobox', { name: 'Rôle à simuler' }),
        targetRole,
      );
      await user.click(screen.getByRole('button', { name: 'Démarrer la simulation' }));

      expect(mockStart).toHaveBeenCalledTimes(1);
      expect(mockStart).toHaveBeenCalledWith(targetRole, '');
      await waitFor(() => expect(mockReplace).toHaveBeenCalledWith(destination));
      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(toast.error).not.toHaveBeenCalled();
    },
  );

  it('passes the selected server-provided shop tenant to the start service', async () => {
    authorize(Role.SUPER_ADMIN, { shop_tenants: [{ id: 'tenant-id', name: 'Catalogue école' }] });
    mockStart.mockResolvedValueOnce('/trainee/formations');
    const user = userEvent.setup();
    render(<SimulationControls />);

    await user.click(screen.getByRole('button', { name: 'Simuler un rôle' }));
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Rôle à simuler' }),
      Role.TRAINEE,
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Catalogue réel de la Boutique' }),
      'tenant-id',
    );
    await user.click(screen.getByRole('button', { name: 'Démarrer la simulation' }));

    expect(mockStart).toHaveBeenCalledWith(Role.TRAINEE, 'tenant-id');
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/trainee/formations'));
  });

  it.each(['checking', 'transition'] as const)(
    'does not start while the session is %s',
    async (phase) => {
      useSimulationStore.setState({ phase });
      const user = userEvent.setup();
      render(<SimulationControls />);
      await user.click(screen.getByRole('button', { name: 'Simuler un rôle' }));
      await user.selectOptions(
        screen.getByRole('combobox', { name: 'Rôle à simuler' }),
        Role.EDITOR,
      );

      const start = screen.getByRole('button', { name: 'Démarrer la simulation' });
      expect(start).toBeDisabled();
      await user.click(start);
      expect(mockStart).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
    },
  );

  it('reports a rejected start without navigating or closing the role selector', async () => {
    mockStart.mockRejectedValueOnce(new Error('Server rejected the simulation'));
    const user = userEvent.setup();
    render(<SimulationControls />);
    await user.click(screen.getByRole('button', { name: 'Simuler un rôle' }));
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Rôle à simuler' }),
      Role.CLIENT_MANAGER,
    );
    await user.click(screen.getByRole('button', { name: 'Démarrer la simulation' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Impossible de démarrer cette simulation.'),
    );
    expect(mockStart).toHaveBeenCalledWith(Role.CLIENT_MANAGER, '');
    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(screen.getByRole('combobox', { name: 'Rôle à simuler' })).toHaveValue(
      Role.CLIENT_MANAGER,
    );
  });
});
