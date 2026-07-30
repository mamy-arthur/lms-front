/**
 * Tests unitaires — useCreateOrder
 *
 * On vérifie :
 *  - la mutation appelle ordersApi.create avec le payload
 *  - le panier actif et les parcours achetés sont invalidés après succès
 *  - les erreurs API sont propagées
 */

jest.mock('@/shared/api/orders.api', () => ({
  ordersApi: {
    create: jest.fn(),
  },
}));

import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ordersApi } from '@/shared/api/orders.api';
import { cartKeys, purchasedLearningPathKeys } from '@/shared/queries/keys';
import { useCreateOrder } from '../useCreateOrder';

const mockCreate = jest.mocked(ordersApi.create);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return { Wrapper, invalidateSpy, queryClient };
}

describe('useCreateOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('appelle ordersApi.create avec payment_method', async () => {
    mockCreate.mockResolvedValue({
      data: {
        id: 'order-1',
        payment_method: 'cash',
        status: 'pending',
        created_at: '2026-07-28T10:00:00+00:00',
        updated_at: '2026-07-28T10:00:00+00:00',
      },
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateOrder(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ payment_method: 'cash' });
    });

    expect(mockCreate).toHaveBeenCalledWith({ payment_method: 'cash' });
  });

  it('invalide le panier actif et les parcours achetés après succès', async () => {
    mockCreate.mockResolvedValue({
      data: {
        id: 'order-1',
        payment_method: 'bank_transfer',
        status: 'pending',
        created_at: '2026-07-28T10:00:00+00:00',
        updated_at: '2026-07-28T10:00:00+00:00',
      },
    });

    const { Wrapper, invalidateSpy } = createWrapper();
    const { result } = renderHook(() => useCreateOrder(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ payment_method: 'bank_transfer' });
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: cartKeys.active() });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: purchasedLearningPathKeys.all });
    });
  });

  it('propage l’erreur si la création échoue', async () => {
    mockCreate.mockRejectedValue(
      Object.assign(new Error('Unprocessable Content'), { status: 422 }),
    );

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateOrder(), { wrapper: Wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ payment_method: 'card' });
      }),
    ).rejects.toMatchObject({ status: 422 });
  });
});
