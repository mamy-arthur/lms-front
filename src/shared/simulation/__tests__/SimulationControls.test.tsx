import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { Role } from '@/shared/constants/roles';
import { useAuthStore } from '@/shared/stores/auth.store';
import { SimulationControls } from '../SimulationControls';
import { endSimulation, startSimulation } from '../service';
import { useSimulationStore, type SimulationSession } from '../simulation.store';

const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock('sonner', () => ({ toast: { error: jest.fn() } }));
jest.mock('../service', () => ({ startSimulation: jest.fn(), endSimulation: jest.fn() }));

const mockStart = jest.mocked(startSimulation);
const mockEnd = jest.mocked(endSimulation);
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

type User = ReturnType<typeof userEvent.setup>;

/**
 * Radix monte ses options dans un portail, et seulement menu ouvert : on passe donc
 * par le trigger, jamais par `selectOptions` qui suppose un <select> natif.
 */
async function openSelect(user: User, name: string) {
  await user.click(screen.getByRole('combobox', { name }));
  return screen.findByRole('listbox');
}

async function chooseOption(user: User, name: string, option: string | RegExp) {
  await openSelect(user, name);
  await user.click(await screen.findByRole('option', { name: option }));
  // Le menu rend le reste du dialogue inerte : on attend sa fermeture avant la suite.
  await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
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
  it.each([
    {
      realRole: Role.CLIENT_MANAGER,
      targetRole: null,
      message:
        'Seules les formations que vous avez achetées seront visibles dans la simulation stagiaire.',
    },
    {
      realRole: Role.CLIENT_MANAGER,
      targetRole: Role.TRAINEE,
      message:
        'Seules les formations que vous avez achetées seront visibles dans la simulation stagiaire.',
    },
    {
      realRole: Role.EDITOR,
      targetRole: null,
      message:
        'Seules les formations publiées seront présentes dans la Boutique. Aucun paiement ne sera effectué.',
    },
    {
      realRole: Role.EDITOR,
      targetRole: Role.CLIENT_MANAGER,
      message:
        'Seules les formations publiées seront présentes dans la Boutique. Aucun paiement ne sera effectué.',
    },
    {
      realRole: Role.EDITOR,
      targetRole: Role.TRAINEE,
      message:
        'Seules les formations que vous avez publiées seront visibles dans la simulation stagiaire.',
    },
    {
      realRole: Role.SUPER_ADMIN,
      targetRole: Role.TRAINEE,
      message: 'Seule la Boutique affiche des données réelles. Aucun paiement ne sera effectué.',
    },
  ])('shows the notice for $realRole → $targetRole', async ({ realRole, targetRole, message }) => {
    authorize(realRole);
    const user = userEvent.setup();
    render(<SimulationControls />);

    await user.click(screen.getByRole('button', { name: 'Simuler un rôle' }));
    if (targetRole) {
      await chooseOption(user, 'Rôle à simuler', labels[targetRole]);
    }

    expect(screen.getByText(message)).toBeVisible();
    expect(mockStart).not.toHaveBeenCalled();
  });

  it('updates the editor notice when switching between client and trainee', async () => {
    authorize(Role.EDITOR);
    const user = userEvent.setup();
    render(<SimulationControls />);
    await user.click(screen.getByRole('button', { name: 'Simuler un rôle' }));

    const shopMessage =
      'Seules les formations publiées seront présentes dans la Boutique. Aucun paiement ne sera effectué.';
    const traineeMessage =
      'Seules les formations que vous avez publiées seront visibles dans la simulation stagiaire.';

    await chooseOption(user, 'Rôle à simuler', 'Client');
    expect(screen.getByText(shopMessage)).toBeVisible();
    expect(screen.queryByText(traineeMessage)).not.toBeInTheDocument();

    await chooseOption(user, 'Rôle à simuler', 'Stagiaire');
    expect(screen.getByText(traineeMessage)).toBeVisible();
    expect(screen.queryByText(shopMessage)).not.toBeInTheDocument();

    await chooseOption(user, 'Rôle à simuler', 'Client');
    expect(screen.getByText(shopMessage)).toBeVisible();
    expect(screen.queryByText(traineeMessage)).not.toBeInTheDocument();
  });

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
      const listbox = await openSelect(user, 'Rôle à simuler');
      expect(
        within(listbox)
          .getAllByRole('option')
          .map((option) => option.textContent),
      ).toEqual(allowedRoles[realRole].map((role) => labels[role]));

      await user.keyboard('{Escape}');
      await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
      expect(screen.getByRole('button', { name: 'Démarrer la simulation' })).toBeDisabled();
    },
  );

  it('uses the returned allowed_roles rather than inferring extra permissions from the real role', async () => {
    authorize(Role.SUPER_ADMIN, { allowed_roles: [Role.TRAINEE] });
    const user = userEvent.setup();
    render(<SimulationControls />);
    await user.click(screen.getByRole('button', { name: 'Simuler un rôle' }));

    const listbox = await openSelect(user, 'Rôle à simuler');
    expect(within(listbox).getAllByRole('option')).toHaveLength(1);
    expect(within(listbox).getByRole('option', { name: 'Stagiaire' })).toBeInTheDocument();
    expect(within(listbox).queryByRole('option', { name: 'Éditeur' })).not.toBeInTheDocument();
    expect(within(listbox).queryByRole('option', { name: 'Client' })).not.toBeInTheDocument();
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
    'offers only a compact exit when %s is already simulating %s',
    (realRole, simulatedRole) => {
      authorize(realRole, { simulated_role: simulatedRole });
      render(<SimulationControls />);

      expect(screen.queryByRole('button', { name: 'Simuler un rôle' })).not.toBeInTheDocument();
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
      const exit = screen.getByRole('button', { name: 'Quitter la simulation' });
      expect(exit).toBeEnabled();
      expect(exit).toHaveClass('h-7');
      expect(exit).toHaveAttribute('title', `Mode simulation : rôle ${labels[simulatedRole]}`);
      expect(mockStart).not.toHaveBeenCalled();
    },
  );

  it('keeps exit available even when no new simulations are allowed', () => {
    authorize(Role.EDITOR, { simulated_role: Role.TRAINEE, allowed_roles: [] });
    render(<SimulationControls />);

    expect(screen.getByRole('button', { name: 'Quitter la simulation' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Simuler un rôle' })).not.toBeInTheDocument();
  });

  it('waits for a confirmed exit before returning without logging out', async () => {
    authorize(Role.EDITOR, { simulated_role: Role.TRAINEE });
    const realUser = useAuthStore.getState().user;
    const clearAuth = jest.spyOn(useAuthStore.getState(), 'clearAuth');
    const destination = '/admin/programs?page=2';
    let resolve!: (value: string) => void;
    const result = new Promise<string>((done) => {
      resolve = done;
    });
    mockEnd.mockImplementationOnce(() => {
      useSimulationStore.setState({ phase: 'transition' });
      return result;
    });
    const user = userEvent.setup();
    render(<SimulationControls />);

    await user.click(screen.getByRole('button', { name: 'Quitter la simulation' }));
    expect(mockEnd).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Quitter la simulation' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Quitter la simulation' }));
    expect(mockEnd).toHaveBeenCalledTimes(1);

    await act(async () => {
      // Complete the state restoration normally performed by endSimulation.
      authorize(Role.EDITOR);
      resolve(destination);
      await result;
    });

    expect(mockReplace).toHaveBeenCalledWith(destination);
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(clearAuth).not.toHaveBeenCalled();
    expect(useAuthStore.getState()).toMatchObject({
      user: realUser,
      role: Role.EDITOR,
      simulatedRole: null,
      sessionId: 'real-session',
    });
    expect(screen.getByRole('button', { name: 'Simuler un rôle' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Quitter la simulation' })).not.toBeInTheDocument();
    clearAuth.mockRestore();
  });

  it.each(['checking', 'transition'] as const)('disables exit during %s', async (phase) => {
    authorize(Role.CLIENT_MANAGER, { simulated_role: Role.TRAINEE });
    useSimulationStore.setState({ phase });
    const user = userEvent.setup();
    render(<SimulationControls />);

    const exit = screen.getByRole('button', { name: 'Quitter la simulation' });
    expect(exit).toBeDisabled();
    await user.click(exit);
    expect(mockEnd).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('keeps the simulation and exit button when exit cannot be confirmed', async () => {
    authorize(Role.EDITOR, { simulated_role: Role.TRAINEE });
    mockEnd.mockRejectedValueOnce(new Error('Exit could not be confirmed'));
    const user = userEvent.setup();
    render(<SimulationControls />);

    await user.click(screen.getByRole('button', { name: 'Quitter la simulation' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'La sortie n’a pas pu être confirmée. La simulation reste isolée.',
      ),
    );
    expect(mockReplace).not.toHaveBeenCalled();
    expect(useAuthStore.getState().simulatedRole).toBe(Role.TRAINEE);
    expect(screen.getByRole('button', { name: 'Quitter la simulation' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Simuler un rôle' })).not.toBeInTheDocument();
  });

  it.each(directTransitions)(
    'starts %s → %s directly and redirects to %s',
    async (realRole, targetRole, destination) => {
      authorize(realRole);
      mockStart.mockResolvedValueOnce(destination);
      const user = userEvent.setup();
      render(<SimulationControls />);

      await user.click(screen.getByRole('button', { name: 'Simuler un rôle' }));
      await chooseOption(user, 'Rôle à simuler', labels[targetRole]);
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
    await chooseOption(user, 'Rôle à simuler', 'Stagiaire');
    await chooseOption(user, 'Catalogue réel de la Boutique', 'Catalogue école');
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
      await chooseOption(user, 'Rôle à simuler', 'Éditeur');

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
    await chooseOption(user, 'Rôle à simuler', 'Client');
    await user.click(screen.getByRole('button', { name: 'Démarrer la simulation' }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Impossible de démarrer cette simulation.'),
    );
    expect(mockStart).toHaveBeenCalledWith(Role.CLIENT_MANAGER, '');
    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeVisible();
    // Le trigger Radix est un <button> : la sélection se lit dans son libellé, pas dans `value`.
    expect(screen.getByRole('combobox', { name: 'Rôle à simuler' })).toHaveTextContent('Client');
  });
});
