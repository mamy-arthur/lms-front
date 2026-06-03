import { useQuery } from "@tanstack/react-query";
import { adminUsersApi } from "../api";
import { normalizeUser } from "../types";

interface Params {
  page: number;
  perPage: number;
  q?: string;
}

export function useUsersQuery({ page, perPage, q }: Params) {
  return useQuery({
    queryKey: ["admin", "users", { page, perPage, q }],
    queryFn: async () => {
      const resp = await adminUsersApi.list({ page, limit: perPage, q });
      const raw = resp.items ?? resp.data ?? [];
      return {
        data: raw.map((u) => normalizeUser(u as unknown as Record<string, unknown>)),
        total: resp.total ?? raw.length,
      };
    },
  });
}
