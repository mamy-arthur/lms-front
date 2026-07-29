import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cartsApi } from '@/shared/api/carts.api';
import { cartKeys } from '@/shared/queries/keys';
import type {
  AddCartItemPayload,
  ApiCartResponse,
  CartItemQuantityDelta,
} from '@/shared/types/cart.types';

function useSetCartCache() {
  const queryClient = useQueryClient();

  return (response: ApiCartResponse) => {
    queryClient.setQueryData<ApiCartResponse>(cartKeys.active(), response);
  };
}

export function useAddCartItem() {
  const setCartCache = useSetCartCache();

  return useMutation({
    mutationFn: (data: AddCartItemPayload) => cartsApi.addItem(data),
    onSuccess: setCartCache,
  });
}

export function useUpdateCartItem() {
  const setCartCache = useSetCartCache();

  return useMutation({
    mutationFn: ({ itemId, delta }: { itemId: string; delta: CartItemQuantityDelta }) =>
      cartsApi.updateItem(itemId, { delta }),
    onSuccess: setCartCache,
  });
}

export function useRemoveCartItem() {
  const setCartCache = useSetCartCache();

  return useMutation({
    mutationFn: (itemId: string) => cartsApi.removeItem(itemId),
    onSuccess: setCartCache,
  });
}
