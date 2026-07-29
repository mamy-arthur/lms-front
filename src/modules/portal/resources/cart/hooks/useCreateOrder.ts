import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/shared/api/orders.api';
import { cartKeys } from '@/shared/queries/keys';
import type { CreateOrderPayload } from '@/shared/types/order.types';

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrderPayload) => ordersApi.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cartKeys.active() });
    },
  });
}
