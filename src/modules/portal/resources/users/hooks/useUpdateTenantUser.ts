import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantUsersApi } from '../api';
import type { TenantUser, UpdateTenantUserPayload } from '../types';
import { normalizeTenantUser } from '../types';
import { TENANT_USERS_QUERY_KEY } from './useTenantUsersQuery';

export function useUpdateTenantUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTenantUserPayload }) =>
      tenantUsersApi.update(id, data),
    onSuccess: ({ data: rawUser }) => {
      const updated = normalizeTenantUser(rawUser as unknown as Record<string, unknown>);
      queryClient.setQueryData<TenantUser[]>(TENANT_USERS_QUERY_KEY, (prev = []) =>
        prev.map((u) => (u.id === updated.id ? updated : u)),
      );
    },
  });
}
