jest.mock('@/shared/stores/auth.store', () => ({
  useAuthStore: (selector: (state: { role: Role; simulatedRole: Role | null }) => unknown) =>
    selector({ role: mockCallerRole, simulatedRole: mockSimulatedRole }),
}));

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }));

jest.mock('@/shared/stores/tenant.store', () => ({
  useTenantStore: (selector: (state: { tenant: { id: string } | null }) => unknown) =>
    selector({ tenant: mockActiveTenant }),
}));

jest.mock('@/modules/admin/resources/tenants/api', () => ({
  tenantApi: { getAll: jest.fn() },
}));

jest.mock('@/modules/admin/resources/clients/api', () => ({
  adminClientsApi: { list: jest.fn() },
}));

jest.mock('@/modules/admin/resources/users/api', () => ({
  adminUsersApi: { list: jest.fn() },
}));

jest.mock('../_components/admin-user-form-drawer', () => ({
  AdminUserFormDrawer: ({ open, user }: { open: boolean; user?: { full_name: string } }) =>
    open ? <div role="dialog">Modifier {user?.full_name}</div> : null,
}));

jest.mock('@/modules/shared/components/trainees/TraineeDetailDrawer', () => ({
  TraineeDetailDrawer: ({ id, area, onClose }: ComponentProps<typeof TraineeDetailDrawer>) =>
    id ? (
      <div role="dialog" aria-label="Détail du stagiaire">
        Stagiaire {id} ({area})<button onClick={onClose}>Fermer le détail du stagiaire</button>
      </div>
    ) : null,
}));

jest.mock('../_components/admin-users-table', () => ({
  AdminUsersTable: ({
    page,
    onPageChange,
    hasQuery,
    users,
    onRowClick,
    onView,
    onEdit,
  }: ComponentProps<typeof AdminUsersTable>) => (
    <section aria-label="Resultats">
      <span>Page {page + 1}</span>
      <p>{hasQuery ? 'Aucun resultat pour ces filtres' : 'Aucun utilisateur'}</p>
      <button onClick={() => onPageChange(page + 1)}>Page suivante</button>
      {users.map((user) => (
        <div key={user.id}>
          <button onClick={() => onRowClick?.(user)}>Ouvrir {user.full_name}</button>
          <button onClick={() => onView?.(user)}>Voir {user.full_name}</button>
          <button onClick={() => onEdit(user)}>Modifier {user.full_name}</button>
        </div>
      ))}
    </section>
  ),
}));

import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { adminClientsApi, normalizeClient } from '@/modules/admin/resources/clients';
import { tenantApi } from '@/modules/admin/resources/tenants/api';
import type { TraineeDetailDrawer } from '@/modules/shared/components/trainees/TraineeDetailDrawer';
import { Role } from '@/shared/constants/roles';
import { renderWithQueryClient } from '@/shared/lib/test-utils';
import { MOCK_TENANTS } from '@/shared/mocks/tenant/mock-tenants';
import { SIMULATION_IDS } from '@/shared/simulation/fixtures';
import { adminUsersApi } from '../../api';
import { normalizeUser } from '../../types';
import type { AdminUsersTable } from '../_components/admin-users-table';
import { UsersList } from '../UsersList';

let mockActiveTenant: { id: string } | null = null;
let mockCallerRole: Role = Role.SUPER_ADMIN;
let mockSimulatedRole: Role | null = null;
const mockPush = jest.fn();
const TENANTS = [
  { ...MOCK_TENANTS[0], name: 'Tenant Alpha' },
  { ...MOCK_TENANTS[1], name: 'Tenant Beta' },
];
const CLIENT = normalizeClient({
  id: 'client-a',
  name: 'Client Alpha',
  tenant_id: String(TENANTS[0].id),
});

async function goToLaterPage(interaction: ReturnType<typeof userEvent.setup>) {
  await interaction.click(screen.getByRole('button', { name: 'Page suivante' }));
  await waitFor(() =>
    expect(adminUsersApi.list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 })),
  );
}

describe('UsersList - filtres tenant et client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.history.replaceState(null, '', '/admin/users');
    mockActiveTenant = null;
    mockCallerRole = Role.SUPER_ADMIN;
    mockSimulatedRole = null;
    jest.mocked(tenantApi.getAll).mockResolvedValue({ data: TENANTS });
    jest.mocked(adminClientsApi.list).mockResolvedValue({ data: [CLIENT] });
    jest.mocked(adminUsersApi.list).mockResolvedValue({ data: [], total: 0 });
  });

  afterEach(() => {
    window.history.replaceState(null, '', '/');
    jest.useRealTimers();
  });

  it.each(['Alice', ''])(
    'restaure la recherche « %s » après retour navigateur sans réactiver le brouillon',
    async (initialSearch) => {
      jest.useFakeTimers();
      const interaction = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
      const alice = normalizeUser({
        id: 'trainee-alice',
        full_name: 'Alice Dupont',
        role: Role.TRAINEE,
      });
      const bob = normalizeUser({
        id: 'trainee-bob',
        full_name: 'Bob Martin',
        role: Role.TRAINEE,
      });
      const initialParams = new URLSearchParams({
        ...(initialSearch ? { q: initialSearch } : {}),
        roles: Role.TRAINEE,
        is_active: 'false',
        page: '3',
        page_size: '50',
        sort_by: 'email',
        sort_dir: 'asc',
        tenant_id: String(TENANTS[0].id),
        client_id: CLIENT.id,
      });
      window.history.replaceState(null, '', `/admin/users?${initialParams}`);
      const initialUrl = window.location.href;
      const list = jest.mocked(adminUsersApi.list);
      list.mockImplementation(async (params) => ({
        data: [params?.q === 'Bob' ? bob : alice],
        total: 200,
      }));
      renderWithQueryClient(<UsersList />);
      await interaction.click(await screen.findByRole('button', { name: 'Ouvrir Alice Dupont' }));
      await interaction.click(
        screen.getByRole('button', { name: 'Fermer le détail du stagiaire' }),
      );

      const search = screen.getByRole('textbox', { name: 'Rechercher' });
      await interaction.clear(search);
      await interaction.type(search, 'Bob');
      await act(async () => jest.advanceTimersByTimeAsync(400));
      await screen.findByRole('button', { name: 'Ouvrir Bob Martin' });
      expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'Bob', page: 0 }));
      list.mockClear();

      await act(async () => {
        window.history.back();
        await jest.advanceTimersByTimeAsync(10);
      });
      expect(search).toHaveValue(initialSearch);
      await screen.findByRole('button', { name: 'Ouvrir Alice Dupont' });
      expect(screen.queryByRole('button', { name: 'Ouvrir Bob Martin' })).not.toBeInTheDocument();
      await act(async () => jest.advanceTimersByTimeAsync(500));
      expect(window.location.href).toBe(initialUrl);
      expect(search).toHaveValue(initialSearch);
      expect(screen.getByText('Page 3')).toBeInTheDocument();
      expect(list).toHaveBeenCalledTimes(1);
      expect(list.mock.calls[0][0]?.q).toBe(initialSearch || undefined);
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          roles: Role.TRAINEE,
          is_active: false,
          page: 2,
          page_size: 50,
          sort_by: 'email',
          sort_dir: 'asc',
          tenant_id: String(TENANTS[0].id),
          client_id: CLIENT.id,
        }),
      );

      await act(async () => {
        window.history.forward();
        await jest.advanceTimersByTimeAsync(10);
      });
      await screen.findByRole('button', { name: 'Ouvrir Bob Martin' });
      expect(search).toHaveValue('Bob');
      expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'Bob', page: 0 }));
    },
  );

  it.each(['Ouvrir', 'Voir'])(
    'ouvre le détail du stagiaire depuis %s sans quitter la liste ni perdre ses filtres',
    async (action) => {
      window.history.replaceState(
        null,
        '',
        `/admin/users?q=Alice&roles=TRAINEE&is_active=false&page=4&page_size=50&sort_by=email&sort_dir=asc&tenant_id=${TENANTS[0].id}&client_id=${CLIENT.id}&view=compact`,
      );
      const listUrl = new URL(window.location.href);
      const trainee = normalizeUser({
        id: 'trainee-1',
        full_name: 'Alice Dupont',
        role: Role.TRAINEE,
      });
      jest.mocked(adminUsersApi.list).mockResolvedValue({ data: [trainee], total: 200 });
      const interaction = userEvent.setup();
      renderWithQueryClient(<UsersList />);
      await interaction.click(
        await screen.findByRole('button', { name: `${action} Alice Dupont` }),
      );
      expect(screen.getByRole('dialog')).toHaveTextContent('Stagiaire trainee-1 (admin)');
      expect(window.location.pathname).toBe('/admin/users');
      expect(Object.fromEntries(new URLSearchParams(window.location.search))).toEqual({
        ...Object.fromEntries(listUrl.searchParams),
        trainee: trainee.id,
      });
      expect(screen.getByRole('region', { name: 'Resultats' })).toBeInTheDocument();
      expect(screen.getByText('Page 4')).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();

      await interaction.click(
        screen.getByRole('button', { name: 'Fermer le détail du stagiaire' }),
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(window.location.href).toBe(listUrl.href);
      expect(screen.getByRole('textbox', { name: 'Rechercher' })).toHaveValue('Alice');
      expect(screen.getByText('Page 4')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Ouvrir Alice Dupont' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '1 rôle' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Inactif' })).toBeInTheDocument();
      expect(await screen.findByRole('button', { name: 'Tenant Alpha' })).toBeInTheDocument();
      expect(await screen.findByRole('button', { name: 'Client Alpha' })).toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    },
  );

  it.each([Role.EDITOR, Role.CLIENT_MANAGER, Role.SUPER_ADMIN])(
    'conserve l’édition au clic pour %s',
    async (role) => {
      jest.mocked(adminUsersApi.list).mockResolvedValue({
        data: [normalizeUser({ id: 'user-1', full_name: 'Autre utilisateur', role })],
        total: 1,
      });
      const interaction = userEvent.setup();
      renderWithQueryClient(<UsersList />);
      await interaction.click(
        await screen.findByRole('button', { name: 'Ouvrir Autre utilisateur' }),
      );
      expect(screen.getByRole('dialog')).toHaveTextContent('Modifier Autre utilisateur');
      expect(mockPush).not.toHaveBeenCalled();
      expect(new URLSearchParams(window.location.search).has('trainee')).toBe(false);
    },
  );

  it('Modifier conserve le tiroir même pour un stagiaire', async () => {
    jest.mocked(adminUsersApi.list).mockResolvedValue({
      data: [normalizeUser({ id: 'trainee-1', full_name: 'Alice Dupont', role: Role.TRAINEE })],
      total: 1,
    });
    const interaction = userEvent.setup();
    renderWithQueryClient(<UsersList />);
    await interaction.click(await screen.findByRole('button', { name: 'Modifier Alice Dupont' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Modifier Alice Dupont');
    expect(mockPush).not.toHaveBeenCalled();
    expect(new URLSearchParams(window.location.search).has('trainee')).toBe(false);
  });

  it('restaure les filtres tenant/client et la pagination au retour', async () => {
    window.history.replaceState(
      null,
      '',
      `/admin/users?q=Alice&roles=TRAINEE&is_active=false&page=4&page_size=50&sort_by=email&sort_dir=asc&tenant_id=${TENANTS[0].id}&client_id=${CLIENT.id}`,
    );
    renderWithQueryClient(<UsersList />);
    expect(screen.getByRole('textbox', { name: 'Rechercher' })).toHaveValue('Alice');
    expect(screen.getByText('Page 4')).toBeInTheDocument();
    await screen.findByRole('button', { name: 'Tenant Alpha' });
    await screen.findByRole('button', { name: 'Client Alpha' });
    await waitFor(() =>
      expect(adminUsersApi.list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          q: 'Alice',
          roles: 'TRAINEE',
          is_active: false,
          page: 3,
          page_size: 50,
          sort_by: 'email',
          sort_dir: 'asc',
          tenant_id: String(TENANTS[0].id),
          client_id: CLIENT.id,
        }),
      ),
    );
  });

  it.each(['tenant', 'client'])(
    'revient a la premiere page a la selection du filtre %s',
    async (filter) => {
      const interaction = userEvent.setup();
      if (filter === 'client') mockActiveTenant = { id: String(TENANTS[0].id) };
      renderWithQueryClient(<UsersList />);
      await goToLaterPage(interaction);

      const isTenant = filter === 'tenant';
      await interaction.click(
        await screen.findByRole('button', {
          name: isTenant ? 'Tous les tenants' : 'Tous les clients',
        }),
      );
      await interaction.click(
        screen.getByRole('radio', {
          name: isTenant ? 'Tenant Alpha' : 'Client Alpha',
        }),
      );

      await waitFor(() => {
        expect(adminUsersApi.list).toHaveBeenLastCalledWith(
          expect.objectContaining({
            page: 0,
            [isTenant ? 'tenant_id' : 'client_id']: isTenant ? String(TENANTS[0].id) : CLIENT.id,
          }),
        );
      });
      await interaction.keyboard('{Escape}');
      expect(screen.getByText('Page 1')).toBeInTheDocument();
      expect(screen.getByText('Aucun resultat pour ces filtres')).toBeInTheDocument();
    },
  );

  it.each(['tenant', 'client'])(
    'revient a la premiere page quand on efface le filtre %s',
    async (filter) => {
      const interaction = userEvent.setup();
      if (filter === 'client') mockActiveTenant = { id: String(TENANTS[0].id) };
      renderWithQueryClient(<UsersList />);
      const isTenant = filter === 'tenant';
      const label = isTenant ? 'Tenant Alpha' : 'Client Alpha';
      await interaction.click(
        await screen.findByRole('button', {
          name: isTenant ? 'Tous les tenants' : 'Tous les clients',
        }),
      );
      await interaction.click(screen.getByRole('radio', { name: label }));
      await interaction.keyboard('{Escape}');
      await goToLaterPage(interaction);

      await interaction.click(screen.getByRole('button', { name: label }));
      await interaction.click(screen.getByRole('button', { name: 'Effacer' }));
      await interaction.keyboard('{Escape}');

      await waitFor(() => {
        expect(adminUsersApi.list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 0 }));
      });
      const lastParams = jest.mocked(adminUsersApi.list).mock.calls.at(-1)?.[0];
      expect(lastParams).not.toHaveProperty(isTenant ? 'tenant_id' : 'client_id');
      expect(screen.getByText('Aucun utilisateur')).toBeInTheDocument();
    },
  );

  it('ne charge les clients du domaine central qu apres le choix du tenant', async () => {
    const interaction = userEvent.setup();
    renderWithQueryClient(<UsersList />);
    await waitFor(() => expect(adminUsersApi.list).toHaveBeenCalled());
    expect(adminClientsApi.list).not.toHaveBeenCalled();
    await interaction.click(await screen.findByRole('button', { name: 'Tous les tenants' }));
    await interaction.click(screen.getByRole('radio', { name: 'Tenant Alpha' }));
    await waitFor(() => expect(adminClientsApi.list).toHaveBeenCalledWith(String(TENANTS[0].id)));
    const calls = jest.mocked(adminClientsApi.list).mock.calls.length;
    await interaction.click(screen.getByRole('button', { name: 'Effacer' }));
    expect(adminClientsApi.list).toHaveBeenCalledTimes(calls);
    expect(adminClientsApi.list).not.toHaveBeenCalledWith(null);
  });

  it('conserve le chargement implicite des clients pour un editeur', async () => {
    mockCallerRole = Role.EDITOR;
    renderWithQueryClient(<UsersList />);
    await waitFor(() => expect(adminClientsApi.list).toHaveBeenCalledWith(null));
  });

  it('retire le filtre client quand le client disparait de la liste chargee', async () => {
    const interaction = userEvent.setup();
    mockActiveTenant = { id: String(TENANTS[0].id) };
    const view = renderWithQueryClient(<UsersList />);
    await interaction.click(await screen.findByRole('button', { name: 'Tous les clients' }));
    await interaction.click(screen.getByRole('radio', { name: 'Client Alpha' }));
    await interaction.keyboard('{Escape}');
    await waitFor(() =>
      expect(adminUsersApi.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ client_id: CLIENT.id }),
      ),
    );

    jest.mocked(adminClientsApi.list).mockResolvedValue({ data: [] });
    mockActiveTenant = { id: String(TENANTS[1].id) };
    view.rerender(<UsersList />);

    await waitFor(() =>
      expect(jest.mocked(adminUsersApi.list).mock.calls.at(-1)?.[0]).not.toHaveProperty(
        'client_id',
      ),
    );
    expect(screen.queryByRole('button', { name: 'Client Alpha' })).not.toBeInTheDocument();
  });

  it('retire le filtre client quand le tenant change', async () => {
    const interaction = userEvent.setup();
    renderWithQueryClient(<UsersList />);
    await interaction.click(await screen.findByRole('button', { name: 'Tous les tenants' }));
    await interaction.click(screen.getByRole('radio', { name: 'Tenant Alpha' }));
    await interaction.keyboard('{Escape}');
    await interaction.click(await screen.findByRole('button', { name: 'Tous les clients' }));
    await interaction.click(screen.getByRole('radio', { name: 'Client Alpha' }));
    await interaction.keyboard('{Escape}');
    await goToLaterPage(interaction);

    await interaction.click(screen.getByRole('button', { name: 'Tenant Alpha' }));
    await interaction.click(screen.getByRole('radio', { name: 'Tenant Beta' }));
    await interaction.keyboard('{Escape}');

    await waitFor(() => {
      expect(adminUsersApi.list).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 0,
          tenant_id: String(TENANTS[1].id),
        }),
      );
    });
    expect(jest.mocked(adminUsersApi.list).mock.calls.at(-1)?.[0]).not.toHaveProperty('client_id');
  });

  it.each([Role.EDITOR, Role.CLIENT_MANAGER])(
    'utilise le tenant fictif pour le role simule %s',
    async (role) => {
      mockActiveTenant = { id: 'real-tenant' };
      mockSimulatedRole = role;
      mockCallerRole = role;
      renderWithQueryClient(<UsersList />);

      await waitFor(() =>
        expect(adminUsersApi.list).toHaveBeenCalledWith(
          expect.objectContaining({ tenant_id: SIMULATION_IDS.tenant }),
        ),
      );
      expect(adminUsersApi.list).not.toHaveBeenCalledWith(
        expect.objectContaining({ tenant_id: 'real-tenant' }),
      );
      expect(tenantApi.getAll).not.toHaveBeenCalled();
      expect(screen.queryByRole('button', { name: 'Tous les tenants' })).not.toBeInTheDocument();
      if (role === Role.EDITOR) {
        await waitFor(() =>
          expect(adminClientsApi.list).toHaveBeenCalledWith(SIMULATION_IDS.tenant),
        );
      } else {
        expect(adminClientsApi.list).not.toHaveBeenCalled();
      }
    },
  );

  it('ne considere pas le tenant du sous-domaine comme un filtre choisi', async () => {
    mockActiveTenant = { id: String(TENANTS[0].id) };
    renderWithQueryClient(<UsersList />);

    await waitFor(() => {
      expect(adminUsersApi.list).toHaveBeenCalledWith(
        expect.objectContaining({
          tenant_id: mockActiveTenant?.id,
        }),
      );
    });
    expect(screen.getByText('Aucun utilisateur')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Tous les tenants' })).not.toBeInTheDocument();
  });
});
