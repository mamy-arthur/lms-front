/**
 * Tests unitaires — useCartActions
 *
 * On mocke useCartQuery / useCartMutations / toast pour vérifier :
 *  - add / increase / decrease / remove (succès + erreurs)
 *  - silentSuccess sur add
 *  - garde quantity <= 1 sur decrease
 *  - findItem
 *  - isMutatingFor
 */

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock('@/modules/portal/resources/cart/hooks/useCartQuery', () => ({
  useCartQuery: jest.fn(),
}));

jest.mock('@/modules/portal/resources/cart/hooks/useCartMutations', () => ({
  useAddCartItem: jest.fn(),
  useUpdateCartItem: jest.fn(),
  useRemoveCartItem: jest.fn(),
}));

import { renderHook, act } from '@testing-library/react';
import { toast } from 'sonner';
import { useCartActions } from '../useCartActions';
import { useCartQuery } from '../useCartQuery';
import { useAddCartItem, useUpdateCartItem, useRemoveCartItem } from '../useCartMutations';
import type { ApiCart, ApiCartItem } from '@/shared/types/cart.types';

const mockUseCartQuery = jest.mocked(useCartQuery);
const mockUseAddCartItem = jest.mocked(useAddCartItem);
const mockUseUpdateCartItem = jest.mocked(useUpdateCartItem);
const mockUseRemoveCartItem = jest.mocked(useRemoveCartItem);
const mockToast = jest.mocked(toast);

const ITEM: ApiCartItem = {
  id: 'item-1',
  cart_id: 'cart-1',
  learning_path_id: 'lp-1',
  name: 'Formation',
  price: 100,
  quantity: 2,
  currency: 'EUR',
  created_at: '2026-07-27T10:00:00+00:00',
  updated_at: '2026-07-27T10:00:00+00:00',
};

const CART: ApiCart = {
  id: 'cart-1',
  tenant_id: 'tenant-1',
  user_id: 'user-1',
  status: 'active',
  currency: 'EUR',
  total: 200,
  items: [ITEM],
  created_at: '2026-07-27T10:00:00+00:00',
  updated_at: '2026-07-27T10:00:00+00:00',
};

function mockMutation(overrides: {
  mutateAsync?: jest.Mock;
  isPending?: boolean;
  variables?: unknown;
}) {
  return {
    mutateAsync: overrides.mutateAsync ?? jest.fn().mockResolvedValue({ data: CART }),
    isPending: overrides.isPending ?? false,
    variables: overrides.variables,
  } as unknown as ReturnType<typeof useAddCartItem>;
}

describe('useCartActions', () => {
  const addMutateAsync = jest.fn();
  const updateMutateAsync = jest.fn();
  const removeMutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseCartQuery.mockReturnValue({
      data: { data: CART },
    } as unknown as ReturnType<typeof useCartQuery>);

    addMutateAsync.mockResolvedValue({ data: CART });
    updateMutateAsync.mockResolvedValue({ data: CART });
    removeMutateAsync.mockResolvedValue({ data: { ...CART, items: [], total: 0 } });

    mockUseAddCartItem.mockReturnValue(mockMutation({ mutateAsync: addMutateAsync }));
    mockUseUpdateCartItem.mockReturnValue(
      mockMutation({ mutateAsync: updateMutateAsync }) as unknown as ReturnType<
        typeof useUpdateCartItem
      >,
    );
    mockUseRemoveCartItem.mockReturnValue(
      mockMutation({ mutateAsync: removeMutateAsync }) as unknown as ReturnType<
        typeof useRemoveCartItem
      >,
    );
  });

  // ── findItem ────────────────────────────────────────────────────────────────

  describe('findItem', () => {
    it('retourne l’item du panier pour un learning_path_id', () => {
      const { result } = renderHook(() => useCartActions());
      expect(result.current.findItem('lp-1')).toEqual(ITEM);
    });

    it('retourne undefined si le parcours n’est pas dans le panier', () => {
      const { result } = renderHook(() => useCartActions());
      expect(result.current.findItem('lp-unknown')).toBeUndefined();
    });
  });

  // ── add ─────────────────────────────────────────────────────────────────────

  describe('add', () => {
    it('appelle la mutation avec learning_path_id et toast succès', async () => {
      const { result } = renderHook(() => useCartActions());

      let ok = false;
      await act(async () => {
        ok = await result.current.add('lp-2');
      });

      expect(addMutateAsync).toHaveBeenCalledWith({ learning_path_id: 'lp-2' });
      expect(mockToast.success).toHaveBeenCalledWith('Formation ajoutée au panier.');
      expect(ok).toBe(true);
    });

    it('n’affiche pas le toast succès si silentSuccess', async () => {
      const { result } = renderHook(() => useCartActions());

      await act(async () => {
        await result.current.add('lp-2', { silentSuccess: true });
      });

      expect(mockToast.success).not.toHaveBeenCalled();
    });

    it('affiche un toast erreur et retourne false en cas d’échec', async () => {
      addMutateAsync.mockRejectedValue({
        json: { message: 'Parcours déjà présent dans le panier' },
      });
      const { result } = renderHook(() => useCartActions());

      let ok = true;
      await act(async () => {
        ok = await result.current.add('lp-1');
      });

      expect(mockToast.error).toHaveBeenCalledWith('Parcours déjà présent dans le panier');
      expect(ok).toBe(false);
    });
  });

  // ── increase ────────────────────────────────────────────────────────────────

  describe('increase', () => {
    it('appelle update avec delta +1', async () => {
      const { result } = renderHook(() => useCartActions());

      await act(async () => {
        await result.current.increase('item-1');
      });

      expect(updateMutateAsync).toHaveBeenCalledWith({ itemId: 'item-1', delta: 1 });
    });

    it('toast erreur et false si l’API échoue', async () => {
      updateMutateAsync.mockRejectedValue(
        Object.assign(new Error('Unprocessable Content'), { status: 422 }),
      );
      const { result } = renderHook(() => useCartActions());

      let ok = true;
      await act(async () => {
        ok = await result.current.increase('item-1');
      });

      expect(mockToast.error).toHaveBeenCalledWith('Impossible d’augmenter la quantité.');
      expect(ok).toBe(false);
    });
  });

  // ── decrease ────────────────────────────────────────────────────────────────

  describe('decrease', () => {
    it('n’appelle pas l’API si quantity <= 1', async () => {
      const { result } = renderHook(() => useCartActions());

      let ok = true;
      await act(async () => {
        ok = await result.current.decrease('item-1', 1);
      });

      expect(updateMutateAsync).not.toHaveBeenCalled();
      expect(ok).toBe(false);
    });

    it('appelle update avec delta -1 si quantity > 1', async () => {
      const { result } = renderHook(() => useCartActions());

      let ok = false;
      await act(async () => {
        ok = await result.current.decrease('item-1', 2);
      });

      expect(updateMutateAsync).toHaveBeenCalledWith({ itemId: 'item-1', delta: -1 });
      expect(ok).toBe(true);
    });

    it('toast erreur et false si l’API échoue', async () => {
      updateMutateAsync.mockRejectedValue({
        json: { message: 'Quantité minimale atteinte' },
      });
      const { result } = renderHook(() => useCartActions());

      let ok = true;
      await act(async () => {
        ok = await result.current.decrease('item-1', 2);
      });

      expect(mockToast.error).toHaveBeenCalledWith('Quantité minimale atteinte');
      expect(ok).toBe(false);
    });
  });

  // ── remove ──────────────────────────────────────────────────────────────────

  describe('remove', () => {
    it('appelle la mutation et toast succès', async () => {
      const { result } = renderHook(() => useCartActions());

      let ok = false;
      await act(async () => {
        ok = await result.current.remove('item-1');
      });

      expect(removeMutateAsync).toHaveBeenCalledWith('item-1');
      expect(mockToast.success).toHaveBeenCalledWith('Formation retirée du panier.');
      expect(ok).toBe(true);
    });

    it('toast erreur et false si l’API échoue', async () => {
      removeMutateAsync.mockRejectedValue(Object.assign(new Error('Not Found'), { status: 404 }));
      const { result } = renderHook(() => useCartActions());

      let ok = true;
      await act(async () => {
        ok = await result.current.remove('item-1');
      });

      expect(mockToast.error).toHaveBeenCalledWith('Impossible de retirer cette formation.');
      expect(ok).toBe(false);
    });
  });

  // ── isMutatingFor ───────────────────────────────────────────────────────────

  describe('isMutatingFor', () => {
    it('détecte un ajout en cours pour un learningPathId', () => {
      mockUseAddCartItem.mockReturnValue(
        mockMutation({
          mutateAsync: addMutateAsync,
          isPending: true,
          variables: { learning_path_id: 'lp-1' },
        }),
      );

      const { result } = renderHook(() => useCartActions());

      expect(result.current.isMutatingFor({ learningPathId: 'lp-1' })).toBe(true);
      expect(result.current.isMutatingFor({ learningPathId: 'lp-other' })).toBe(false);
    });

    it('détecte une mise à jour en cours pour un cartItemId', () => {
      mockUseUpdateCartItem.mockReturnValue(
        mockMutation({
          mutateAsync: updateMutateAsync,
          isPending: true,
          variables: { itemId: 'item-1', delta: 1 },
        }) as unknown as ReturnType<typeof useUpdateCartItem>,
      );

      const { result } = renderHook(() => useCartActions());

      expect(result.current.isMutatingFor({ cartItemId: 'item-1' })).toBe(true);
      expect(result.current.isMutatingFor({ cartItemId: 'item-other' })).toBe(false);
    });

    it('détecte une suppression en cours pour un cartItemId', () => {
      mockUseRemoveCartItem.mockReturnValue(
        mockMutation({
          mutateAsync: removeMutateAsync,
          isPending: true,
          variables: 'item-1',
        }) as unknown as ReturnType<typeof useRemoveCartItem>,
      );

      const { result } = renderHook(() => useCartActions());

      expect(result.current.isMutatingFor({ cartItemId: 'item-1' })).toBe(true);
    });

    it('retourne false quand aucune mutation n’est en cours', () => {
      const { result } = renderHook(() => useCartActions());

      expect(result.current.isMutatingFor({ learningPathId: 'lp-1', cartItemId: 'item-1' })).toBe(
        false,
      );
    });
  });
});
