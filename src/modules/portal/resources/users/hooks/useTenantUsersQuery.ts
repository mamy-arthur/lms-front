import { useQuery } from "@tanstack/react-query";
import { MOCK_USERS } from "@/shared/mocks/users.mock";
import { normalizeTenantUser } from "../types";
import type { TenantUser, TenantUserSearchParams } from "../types";

export const TENANT_USERS_QUERY_KEY = ["tenant", "users"] as const;

function applyParams(users: TenantUser[], params?: TenantUserSearchParams): { data: TenantUser[]; total: number } {
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

  const col = params?.sort_by || "username";
  const dir = params?.sort_dir || "asc";
  data.sort((a, b) => {
    let cmp = 0;
    switch (col) {
      case "username": cmp = a.username.localeCompare(b.username); break;
      case "email":    cmp = a.email.localeCompare(b.email); break;
      case "role":     cmp = a.role.localeCompare(b.role); break;
      case "city":     cmp = a.city.localeCompare(b.city); break;
      case "country":  cmp = a.country.localeCompare(b.country); break;
      case "lastLogin":
        cmp = new Date(a.lastLogin || 0).getTime() - new Date(b.lastLogin || 0).getTime(); break;
      case "createdAt":
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break;
    }
    return dir === "desc" ? -cmp : cmp;
  });

  const total = data.length;
  const page = params?.page ?? 0;
  const pageSize = params?.page_size ?? 12;
  data = data.slice(page * pageSize, (page + 1) * pageSize);

  return { data, total };
}

export function useTenantUsersQuery(params?: TenantUserSearchParams) {
  return useQuery<{ data: TenantUser[]; total: number }>({
    queryKey: [...TENANT_USERS_QUERY_KEY, params],
    queryFn: () => {
      const all = MOCK_USERS.map((u) => normalizeTenantUser(u));
      return applyParams(all, params);
    },
    placeholderData: (prev) => prev,
  });
}
