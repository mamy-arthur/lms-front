/**
 * Tests unitaires — useCartQuery
 *
 * On vérifie que la query n’est activée que pour CLIENT_MANAGER.
 */

jest.mock('@/shared/api/carts.api', () => ({
  cartsApi: { getActive: jest.fn() },
}));

jest.mock('@/shared/stores/auth.store', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
}));

import { renderHook } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';
import { useCartQuery } from '../useCartQuery';
import { useAuthStore } from '@/shared/stores/auth.store';
import { Role } from '@/shared/constants/roles';
import { cartKeys } from '@/shared/queries/keys';
import { cartsApi } from '@/shared/api/carts.api';

const mockUseAuthStore = jest.mocked(useAuthStore);
const mockUseQuery = jest.mocked(useQuery);

describe('useCartQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseQuery.mockReturnValue({ data: undefined } as unknown as ReturnType<typeof useQuery>);
  });

  it('active la query pour CLIENT_MANAGER', () => {
    mockUseAuthStore.mockImplementation(((selector: (s: { role: Role }) => unknown) =>
      selector({ role: Role.CLIENT_MANAGER })) as typeof useAuthStore);

    renderHook(() => useCartQuery());

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: cartKeys.active(),
        enabled: true,
      }),
    );
  });

  it('désactive la query pour TRAINEE', () => {
    mockUseAuthStore.mockImplementation(((selector: (s: { role: Role }) => unknown) =>
      selector({ role: Role.TRAINEE })) as typeof useAuthStore);

    renderHook(() => useCartQuery());

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    );
  });

  it('désactive la query pour EDITOR', () => {
    mockUseAuthStore.mockImplementation(((selector: (s: { role: Role }) => unknown) =>
      selector({ role: Role.EDITOR })) as typeof useAuthStore);

    renderHook(() => useCartQuery());

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      }),
    );
  });

  it('passe cartsApi.getActive comme queryFn', async () => {
    mockUseAuthStore.mockImplementation(((selector: (s: { role: Role }) => unknown) =>
      selector({ role: Role.CLIENT_MANAGER })) as typeof useAuthStore);

    renderHook(() => useCartQuery());

    const options = mockUseQuery.mock.calls[0][0] as {
      queryFn?: (...args: unknown[]) => unknown;
    };
    expect(typeof options.queryFn).toBe('function');
    await options.queryFn?.({});
    expect(cartsApi.getActive).toHaveBeenCalled();
  });
});
