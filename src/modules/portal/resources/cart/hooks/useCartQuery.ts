import { useQuery } from '@tanstack/react-query';
import { cartsApi } from '@/shared/api/carts.api';
import { Role } from '@/shared/constants/roles';
import { cartKeys } from '@/shared/queries/keys';
import { useAuthStore } from '@/shared/stores/auth.store';

export function useCartQuery() {
  const role = useAuthStore((s) => s.role);
  const canManageCart = role === Role.CLIENT_MANAGER;

  return useQuery({
    queryKey: cartKeys.active(),
    queryFn: () => cartsApi.getActive(),
    enabled: canManageCart,
  });
}
