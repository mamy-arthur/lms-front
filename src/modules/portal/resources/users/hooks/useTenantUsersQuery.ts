import { useQuery } from "@tanstack/react-query";
import { MOCK_USERS } from "@modules/shared/components/users/mocks/users.mock";
import { normalizeTenantUser } from "../types";
import type { TenantUser, TenantUserSearchParams } from "../types";

export const TENANT_USERS_QUERY_KEY = ["tenant", "users"] as const;

export function useTenantUsersQuery(params?: TenantUserSearchParams) {
  return useQuery<{ data: TenantUser[]; total: number }>({
    queryKey: [...TENANT_USERS_QUERY_KEY, params],
    queryFn: () => {
      const data = MOCK_USERS.map((u) => normalizeTenantUser(u));
      return { data, total: data.length };
    },
    placeholderData: (prev) => prev,
  });
}
