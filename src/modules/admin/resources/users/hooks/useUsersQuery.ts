import { useQuery } from "@tanstack/react-query";
import { MOCK_USERS } from "@modules/shared/components/users/mocks/users.mock";
import type { UserSearchParams } from "../types";
import { normalizeUser } from "../types";

export const ADMIN_USERS_QUERY_KEY = ["admin", "users"] as const;

export function useUsersQuery(params?: UserSearchParams) {
  return useQuery({
    queryKey: [...ADMIN_USERS_QUERY_KEY, params],
    queryFn: () => {
      const data = MOCK_USERS.map((u) => normalizeUser(u));
      return { data, total: data.length };
    },
    placeholderData: (prev) => prev,
  });
}
