jest.mock('@/shared/stores/auth.store', () => ({
  useAuthStore: () => ({ user: { role: mockCallerRole } }),
}));

jest.mock('@/modules/admin/resources/tenants/api', () => ({
  tenantApi: { getAll: jest.fn() },
}));

jest.mock('@/modules/admin/resources/clients', () => ({
  useClientsQuery: (_enabled: boolean, tenantId?: string | null) => ({
    data: mockClients.filter((client) => client.tenant_id === (tenantId ?? TENANT_A)),
    isLoading: false,
  }),
}));

jest.mock('../../../hooks/useCreateUser', () => ({
  useCreateUser: () => ({ mutate: jest.fn(), reset: jest.fn(), isPending: false }),
}));

jest.mock('../../../hooks/useUpdateUser', () => ({
  useUpdateUser: () => ({ mutate: mockUpdate, reset: jest.fn(), isPending: false }),
}));

jest.mock('@modules/shared/components/users/user-photo-field', () => ({
  UserPhotoField: () => null,
}));

jest.mock('@modules/shared/components/users/user-profile-fields', () => ({
  UserProfileFields: () => null,
}));

import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { tenantApi } from '@/modules/admin/resources/tenants/api';
import { Role } from '@/shared/constants/roles';
import { renderWithQueryClient } from '@/shared/lib/test-utils';
import { MOCK_TENANTS } from '@/shared/mocks/tenant/mock-tenants';
import { normalizeUser } from '../../../types';
import { AdminUserFormDrawer } from '../admin-user-form-drawer';

const TENANT_A = '11111111-1111-4111-8111-111111111111';
const TENANT_B = '22222222-2222-4222-8222-222222222222';
const CLIENT_A = '33333333-3333-4333-8333-333333333333';
const CLIENT_B = '44444444-4444-4444-8444-444444444444';
const mockClients = [
  { id: CLIENT_A, tenant_id: TENANT_A, name: 'Client Alpha' },
  { id: CLIENT_B, tenant_id: TENANT_B, name: 'Client Beta' },
];
const mockUpdate = jest.fn();
let mockCallerRole: Role = Role.SUPER_ADMIN;

const EXISTING_USER = normalizeUser({
  id: '55555555-5555-4555-8555-555555555555',
  tenant_id: TENANT_A,
  client_id: CLIENT_A,
  first_name: 'Alice',
  last_name: 'Test',
  email: 'alice@example.test',
  role: Role.CLIENT_MANAGER,
  is_active: true,
});

const OTHER_USER = normalizeUser({
  ...EXISTING_USER,
  id: '66666666-6666-4666-8666-666666666666',
  tenant_id: TENANT_B,
  client_id: CLIENT_B,
});

describe('AdminUserFormDrawer - rattachement client', () => {
  beforeAll(() => {
    HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockCallerRole = Role.SUPER_ADMIN;
    jest.mocked(tenantApi.getAll).mockResolvedValue({
      data: [
        { ...MOCK_TENANTS[0], id: TENANT_A, name: 'Tenant Alpha' },
        { ...MOCK_TENANTS[1], id: TENANT_B, name: 'Tenant Beta' },
      ],
    } as unknown as Awaited<ReturnType<typeof tenantApi.getAll>>);
  });

  it.each([Role.SUPER_ADMIN, Role.EDITOR])(
    'conserve le client et permet une modification simple pour %s',
    async (role) => {
      mockCallerRole = role;
      const interaction = userEvent.setup();
      const onClose = jest.fn();
      const view = renderWithQueryClient(<AdminUserFormDrawer open={false} onClose={onClose} />);

      view.rerender(<AdminUserFormDrawer open onClose={onClose} user={EXISTING_USER} />);

      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: 'Client' })).toHaveTextContent('Client Alpha');
      });
      await interaction.clear(screen.getByRole('textbox', { name: 'Nom' }));
      await interaction.type(screen.getByRole('textbox', { name: 'Nom' }), 'Modifie');
      await interaction.click(screen.getByRole('button', { name: 'Enregistrer' }));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith(
          expect.objectContaining({
            id: EXISTING_USER.id,
            data: expect.objectContaining({ last_name: 'Modifie' }),
          }),
          expect.any(Object),
        );
      });
      expect(mockUpdate.mock.calls[0][0].data).not.toHaveProperty('client_id');
    },
  );

  it('conserve le client apres fermeture et reouverture', async () => {
    const interaction = userEvent.setup();
    const onClose = jest.fn();
    const view = renderWithQueryClient(<AdminUserFormDrawer open={false} onClose={onClose} />);
    view.rerender(<AdminUserFormDrawer open onClose={onClose} user={EXISTING_USER} />);
    await interaction.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(onClose).toHaveBeenCalled();
    view.rerender(<AdminUserFormDrawer open={false} onClose={onClose} />);
    view.rerender(<AdminUserFormDrawer open onClose={onClose} user={EXISTING_USER} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Client' })).toHaveTextContent('Client Alpha');
    });
  });

  it('charge le client du nouvel utilisateur sans le remettre a zero', async () => {
    const onClose = jest.fn();
    const view = renderWithQueryClient(
      <AdminUserFormDrawer open onClose={onClose} user={EXISTING_USER} />,
    );
    view.rerender(<AdminUserFormDrawer open onClose={onClose} user={OTHER_USER} />);

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Client' })).toHaveTextContent('Client Beta');
    });
  });

  it('exige un nouveau client apres un changement volontaire de tenant', async () => {
    const interaction = userEvent.setup();
    renderWithQueryClient(<AdminUserFormDrawer open onClose={jest.fn()} user={EXISTING_USER} />);
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'Tenant' })).toHaveTextContent('Tenant Alpha');
    });

    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Tenant' }), { key: 'ArrowDown' });
    fireEvent.click(await screen.findByRole('option', { name: 'Tenant Beta' }));
    await interaction.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(await screen.findByText('Client requis')).toBeInTheDocument();
    expect(mockUpdate).not.toHaveBeenCalled();

    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Client' }), { key: 'ArrowDown' });
    fireEvent.click(await screen.findByRole('option', { name: 'Client Beta' }));
    await interaction.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenant_id: TENANT_B, client_id: CLIENT_B }),
        }),
        expect.any(Object),
      );
    });
  });
});
