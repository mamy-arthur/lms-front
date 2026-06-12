import { useQuery } from "@tanstack/react-query";
import { MOCK_USERS } from "@/shared/mocks/users.mock";
import { normalizeUser } from "../types";
import type { User, UserSearchParams } from "../types";

export const ADMIN_USERS_QUERY_KEY = ["admin", "users"] as const;

function applyParams(users: User[], params?: UserSearchParams): { data: User[]; total: number } {
  let data = [...users];

  if (params?.q) {
    const q = params.q.toLowerCase();
    data = data.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.first_name.toLowerCase().includes(q) ||
        u.last_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.city.toLowerCase().includes(q) ||
        u.country.toLowerCase().includes(q),
    );
  }
  if (params?.role) data = data.filter((u) => u.role === params.role);
  if (params?.status === "active") data = data.filter((u) => u.isActive);
  if (params?.status === "inactive") data = data.filter((u) => !u.isActive);
  if (params?.tenant_id) data = data.filter((u) => u.tenantId === params.tenant_id);

  const col = params?.sort_by || "username";
  const dir = params?.sort_dir || "asc";
  data.sort((a, b) => {
    const aVal = String(a[col as keyof User] ?? "");
    const bVal = String(b[col as keyof User] ?? "");
    const cmp = aVal.localeCompare(bVal);
    return dir === "asc" ? cmp : -cmp;
  });

  const total = data.length;
  const page = params?.page ?? 0;
  const pageSize = params?.page_size ?? 25;
  data = data.slice(page * pageSize, (page + 1) * pageSize);

  return { data, total };
}

export function useUsersQuery(params?: UserSearchParams) {
  return useQuery({
    queryKey: [...ADMIN_USERS_QUERY_KEY, params],
    queryFn: () => {
      const all = MOCK_USERS.map((u) => normalizeUser(u));
      return applyParams(all, params);
    },
    placeholderData: (prev) => prev,
  });
}
