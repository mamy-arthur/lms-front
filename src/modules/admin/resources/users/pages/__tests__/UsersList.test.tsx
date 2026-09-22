jest.mock('@/shared/stores/auth.store', () => ({
  useAuthStore: (selector: (state: { role: Role; simulatedRole: Role | null }) => unknown) =>
    selector({ role: mockCallerRole, simulatedRole: mockSimulatedRole }),
}));

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
  AdminUserFormDrawer: () => null,
}));

jest.mock('../_components/admin-users-table', () => ({
  AdminUsersTable: ({ page, onPageChange, hasQuery }: ComponentProps<typeof AdminUsersTable>) => (
    <section aria-label="Resultats">
      <span>Page {page + 1}</span>
      <p>{hasQuery ? 'Aucun resultat pour ces filtres' : 'Aucun utilisateur'}</p>
      <button onClick={() => onPageChange(page + 1)}>Page suivante</button>
    </section>
  ),
}));

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { adminClientsApi, normalizeClient } from '@/modules/admin/resources/clients';
import { tenantApi } from '@/modules/admin/resources/tenants/api';
import { Role } from '@/shared/constants/roles';
import { renderWithQueryClient } from '@/shared/lib/test-utils';
import { MOCK_TENANTS } from '@/shared/mocks/tenant/mock-tenants';
import { SIMULATION_IDS } from '@/shared/simulation/fixtures';
import { adminUsersApi } from '../../api';
import type { AdminUsersTable } from '../_components/admin-users-table';
import { UsersList } from '../UsersList';

let mockActiveTenant: { id: string } | null = null;
let mockCallerRole: Role = Role.SUPER_ADMIN;
let mockSimulatedRole: Role | null = null;
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
    mockActiveTenant = null;
    mockCallerRole = Role.SUPER_ADMIN;
    mockSimulatedRole = null;
    jest.mocked(tenantApi.getAll).mockResolvedValue({ data: TENANTS });
    jest.mocked(adminClientsApi.list).mockResolvedValue({ data: [CLIENT] });
    jest.mocked(adminUsersApi.list).mockResolvedValue({ data: [], total: 0 });
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
        screen.getByRole('checkbox', {
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
      await interaction.click(screen.getByRole('checkbox', { name: label }));
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
    await interaction.click(screen.getByRole('checkbox', { name: 'Tenant Alpha' }));
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

  it('retire le filtre client quand le tenant change', async () => {
    const interaction = userEvent.setup();
    renderWithQueryClient(<UsersList />);
    await interaction.click(await screen.findByRole('button', { name: 'Tous les tenants' }));
    await interaction.click(screen.getByRole('checkbox', { name: 'Tenant Alpha' }));
    await interaction.keyboard('{Escape}');
    await interaction.click(await screen.findByRole('button', { name: 'Tous les clients' }));
    await interaction.click(screen.getByRole('checkbox', { name: 'Client Alpha' }));
    await interaction.keyboard('{Escape}');
    await goToLaterPage(interaction);

    await interaction.click(screen.getByRole('button', { name: 'Tenant Alpha' }));
    await interaction.click(screen.getByRole('checkbox', { name: 'Tenant Beta' }));
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
