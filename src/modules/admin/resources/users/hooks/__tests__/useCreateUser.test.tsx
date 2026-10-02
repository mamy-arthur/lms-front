jest.mock('@/modules/admin/resources/users/api', () => ({
  adminUsersApi: { create: jest.fn() },
}));

jest.mock('@/modules/admin/resources/clients/api', () => ({
  adminClientsApi: { list: jest.fn() },
}));

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
  adminClientsApi,
  normalizeClient,
  useClientsQuery,
} from '@/modules/admin/resources/clients';
import { Role } from '@/shared/constants/roles';
import { adminUsersApi } from '../../api';
import { normalizeUser, type CreateUserPayload } from '../../types';
import { useCreateUser } from '../useCreateUser';

const CLIENT = normalizeClient({ id: 'client-a', tenant_id: 'tenant-a', name: 'Client Alpha' });
const PAYLOAD: CreateUserPayload = {
  first_name: 'Alice',
  last_name: 'Test',
  email: 'alice@example.test',
  password: 'Password123',
  role: Role.CLIENT_MANAGER,
  tenant_id: 'tenant-a',
  client_name: CLIENT.name,
};

function renderCreation() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } },
  });
  return renderHook(
    () => ({ clients: useClientsQuery(true, 'tenant-a'), creation: useCreateUser() }),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    },
  );
}

describe('useCreateUser - actualisation des clients', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(adminClientsApi.list).mockResolvedValue({ data: [] });
    jest.mocked(adminUsersApi.create).mockResolvedValue({ data: normalizeUser({ id: 'user-a' }) });
  });

  it('affiche le nouveau client apres creation du responsable sans recharger la page', async () => {
    const { result } = renderCreation();
    await waitFor(() => expect(result.current.clients.isSuccess).toBe(true));
    expect(result.current.clients.data).toEqual([]);
    jest.mocked(adminClientsApi.list).mockResolvedValue({ data: [CLIENT] });

    await act(async () => {
      await result.current.creation.mutateAsync(PAYLOAD);
    });

    await waitFor(() => expect(result.current.clients.data).toEqual([CLIENT]));
    expect(adminClientsApi.list).toHaveBeenCalledTimes(2);
  });

  it('ne recharge pas les clients apres une creation de stagiaire', async () => {
    const { result } = renderCreation();
    await waitFor(() => expect(result.current.clients.isSuccess).toBe(true));

    await act(async () => {
      await result.current.creation.mutateAsync({
        ...PAYLOAD,
        role: Role.TRAINEE,
        client_name: undefined,
        client_id: CLIENT.id,
      });
    });

    expect(adminClientsApi.list).toHaveBeenCalledTimes(1);
  });

  it('ne recharge pas les clients quand la creation echoue', async () => {
    const { result } = renderCreation();
    await waitFor(() => expect(result.current.clients.isSuccess).toBe(true));
    jest.mocked(adminUsersApi.create).mockRejectedValue(new Error('Creation refusee'));

    await act(async () => {
      await expect(result.current.creation.mutateAsync(PAYLOAD)).rejects.toThrow(
        'Creation refusee',
      );
    });

    expect(adminClientsApi.list).toHaveBeenCalledTimes(1);
  });
});
